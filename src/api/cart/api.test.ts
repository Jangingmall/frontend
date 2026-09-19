import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { server } from "@/mocks/server";
import { getCartShippingAmount } from "@/types/cart";

import {
  addCartItem,
  deleteCartItem,
  fetchCart,
  mergeGuestCart,
  updateCartQuantity,
} from "./api";
const dto = {
  sections: [
    {
      artisanId: 2,
      artisanName: "장인",
      certificationLevel: "MASTER",
      shippingFee: 3000,
      freeShippingThreshold: 50000,
      items: [
        {
          cartItemId: 91,
          productId: 3,
          productName: "그릇",
          unitPrice: 20000,
          quantity: 2,
          subtotal: 40000,
          thumbnail: [],
          isCustomOrder: false,
          soldOut: false,
          selected: true,
          selectedOptions: [],
          textInputs: [],
        },
      ],
    },
  ],
  totalPrice: 40000,
  totalShippingFee: 3000,
  totalCount: 2,
};
it("maps server IDs, availability and section shipping without inventing stock", async () => {
  server.use(
    http.get("*/api/payments/cart", () =>
      HttpResponse.json({ success: true, data: dto }),
    ),
  );
  const cart = await fetchCart();
  expect(cart.lines[0]).toMatchObject({
    lineId: "91",
    productId: 3,
    quantity: 2,
    maxQuantity: Infinity,
  });
  expect(getCartShippingAmount(cart.sections, cart.lines)).toBe(3000);
  expect(getCartShippingAmount(cart.sections, [])).toBe(0);
  expect(
    getCartShippingAmount(cart.sections, [{ ...cart.lines[0], quantity: 3 }]),
  ).toBe(0);
});
it("sends quantity and add commands, deletes an individual item and merges the cookie cart", async () => {
  server.use(
    http.patch("*/api/payments/cart/items/91", async ({ request }) =>
      ((await request.json()) as { quantity: number }).quantity === 4
        ? HttpResponse.json({ success: true, data: dto })
        : new HttpResponse(null, { status: 400 }),
    ),
    http.post("*/api/payments/cart/items", async ({ request }) =>
      JSON.stringify(await request.json()) ===
      JSON.stringify({ productId: 3, quantity: 2 })
        ? HttpResponse.json({ success: true, data: dto })
        : new HttpResponse(null, { status: 400 }),
    ),
    http.delete("*/api/payments/cart/items/91", () =>
      HttpResponse.json({ success: true, data: null }),
    ),
    http.post("*/api/payments/cart/merge", () =>
      HttpResponse.json({ success: true, data: dto }),
    ),
  );
  expect(
    (await updateCartQuantity({ cartItemId: 91, quantity: 4 })).lines,
  ).toHaveLength(1);
  expect((await addCartItem({ productId: 3, quantity: 2 })).lines).toHaveLength(
    1,
  );
  await expect(deleteCartItem(91)).resolves.toBeNull();
  expect((await mergeGuestCart())?.lines[0].lineId).toBe("91");
});
it("rejects invalid money and propagates server mutation errors", async () => {
  server.use(
    http.get("*/api/payments/cart", () =>
      HttpResponse.json({
        success: true,
        data: { ...dto, totalPrice: "wrong" },
      }),
    ),
    http.patch("*/api/payments/cart/items/91", () =>
      HttpResponse.json(
        { errorCode: "BUSINESS_RULE_VIOLATION" },
        { status: 409 },
      ),
    ),
  );
  await expect(fetchCart()).rejects.toThrow();
  await expect(
    updateCartQuantity({ cartItemId: 91, quantity: 9 }),
  ).rejects.toMatchObject({ status: 409 });
});
it("treats only missing guest cookie as a merge no-op", async () => {
  server.use(
    http.post("*/api/payments/cart/merge", () =>
      HttpResponse.json({ errorCode: "INVALID_INPUT" }, { status: 400 }),
    ),
  );
  await expect(mergeGuestCart()).resolves.toBeNull();
  server.use(
    http.post("*/api/payments/cart/merge", () =>
      HttpResponse.json({ errorCode: "CONFLICT" }, { status: 409 }),
    ),
  );
  await expect(mergeGuestCart()).rejects.toMatchObject({ status: 409 });
});
