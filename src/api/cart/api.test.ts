import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { server } from "@/mocks/server";
import { getCartShippingAmount } from "@/types/cart";

import {
  addCartItem,
  deleteCartItem,
  fetchCart,
  mergeGuestCart,
  updateCartOptions,
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
          thumbnail: [
            { url: "/cart.webp", width: 320, height: 320, format: "webp" },
          ],
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
it("preserves server selection when an existing order reservation makes the item sold out", async () => {
  server.use(
    http.get("*/api/payments/cart", () =>
      HttpResponse.json({
        success: true,
        data: {
          ...dto,
          sections: dto.sections.map((section) => ({
            ...section,
            items: section.items.map((item) => ({ ...item, soldOut: true })),
          })),
        },
      }),
    ),
  );
  expect((await fetchCart()).lines[0]).toMatchObject({
    soldOut: true,
    selected: true,
  });
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

it("updates options using server identifiers and returns authoritative cart state", async () => {
  server.use(
    http.patch("*/api/payments/cart/items/91/options", async ({ request }) => {
      expect(await request.json()).toEqual({
        quantity: 3,
        selectedOptions: [{ optionGroupId: 4, choiceId: 8 }],
        textInputs: [{ optionGroupId: 5, text: "새 각인" }],
      });
      return HttpResponse.json({ success: true, data: dto });
    }),
  );
  expect(
    (
      await updateCartOptions({
        cartItemId: 91,
        quantity: 3,
        selectedOptions: [{ optionGroupId: 4, choiceId: 8 }],
        textInputs: [{ optionGroupId: 5, text: "새 각인" }],
      })
    ).lines[0].quantity,
  ).toBe(2);
});

it("fills missing cart images from the public product and deduplicates product lookups", async () => {
  let reads = 0;
  server.use(
    http.get("*/api/payments/cart", () =>
      HttpResponse.json({
        success: true,
        data: {
          ...dto,
          sections: dto.sections.map((section) => ({
            ...section,
            items: [
              { ...section.items[0], thumbnail: [] },
              { ...section.items[0], cartItemId: 92, thumbnail: [] },
            ],
          })),
        },
      }),
    ),
    http.get("*/api/products/3", () => {
      reads++;
      return HttpResponse.json({
        success: true,
        data: { productId: 3, thumbnailUrl: "/legacy.jpg" },
      });
    }),
  );
  const cart = await fetchCart();
  expect(cart.lines.map((line) => line.thumbnailUrl)).toEqual([
    "/legacy.jpg",
    "/legacy.jpg",
  ]);
  expect(reads).toBe(1);
});
it("keeps cart state when the supplementary image request fails", async () => {
  server.use(
    http.get("*/api/payments/cart", () =>
      HttpResponse.json({
        success: true,
        data: {
          ...dto,
          sections: dto.sections.map((section) => ({
            ...section,
            items: [{ ...section.items[0], thumbnail: [] }],
          })),
        },
      }),
    ),
    http.get("*/api/products/3", () => new HttpResponse(null, { status: 503 })),
  );
  expect((await fetchCart()).lines[0]).toMatchObject({
    quantity: 2,
    unitPrice: 20000,
  });
});
it("uses cart image URLs without filtering by format or width or requesting product details", async () => {
  let reads = 0;
  server.use(
    http.get("*/api/payments/cart", () =>
      HttpResponse.json({
        success: true,
        data: {
          ...dto,
          sections: dto.sections.map((section) => ({
            ...section,
            items: [
              {
                ...section.items[0],
                thumbnail: [
                  {
                    url: "/original.jpg",
                    width: 600,
                    height: 400,
                    format: "jpeg",
                  },
                ],
              },
            ],
          })),
        },
      }),
    ),
    http.get("*/api/products/3", () => {
      reads++;
      return new HttpResponse(null, { status: 500 });
    }),
  );
  expect((await fetchCart()).lines[0].thumbnailUrl).toBe("/original.jpg");
  expect(reads).toBe(0);
});
