import { http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import {
  addProductToCart,
  fetchProductActionState,
  requestProductRestock,
  setProductWishlist,
} from "./detail-actions";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));

beforeEach(() => {
  useAuthStore
    .getState()
    .setSession("mock-access-token", { id: 1, name: "구매자", role: "USER" });
});

it("uses authenticated POST/DELETE wish and accepts the null success payload", async () => {
  const methods: string[] = [];
  server.use(
    http.all("*/api/products/101/wish", ({ request }) => {
      expect(request.headers.get("authorization")).toBe(
        "Bearer mock-access-token",
      );
      methods.push(request.method);
      return mockOk(null);
    }),
  );
  expect(await setProductWishlist(101, true)).toMatchObject({ wished: true });
  expect(await setProductWishlist(101, false)).toMatchObject({ wished: false });
  expect(methods).toEqual(["POST", "DELETE"]);
});

it("checks subsequent wish cursor pages before deciding the product is not wished", async () => {
  const cursors: (string | null)[] = [];
  server.use(
    http.get("*/api/member/me/wishes", ({ request }) => {
      const cursor = new URL(request.url).searchParams.get("cursor");
      cursors.push(cursor);
      return mockOk(
        cursor
          ? {
              items: [{ productId: 101 }],
              hasNext: false,
              nextCursor: null,
              totalCount: 2,
            }
          : {
              items: [{ productId: 102 }],
              hasNext: true,
              nextCursor: "next",
              totalCount: 2,
            },
      );
    }),
  );
  expect(await fetchProductActionState(101)).toMatchObject({ wished: true });
  expect(cursors).toEqual([null, "next"]);
});

it("does not convert a failed or broken wish listing into an unwished state", async () => {
  server.use(
    http.get("*/api/member/me/wishes", () =>
      mockOk({ items: [], hasNext: true, nextCursor: null, totalCount: 3 }),
    ),
  );
  await expect(fetchProductActionState(101)).rejects.toThrow();
});

it("translates a single cart selection to the current payments DTO", async () => {
  server.use(
    http.post("*/api/payments/cart/items", async ({ request }) => {
      expect(await request.json()).toEqual({
        productId: 101,
        quantity: 2,
        selectedOptions: [{ optionGroupId: 7, choiceId: 8 }],
        textInputs: [],
      });
      return mockOk({
        sections: [],
        totalPrice: 40000,
        totalShippingFee: 0,
        totalCount: 2,
      });
    }),
  );
  await expect(
    addProductToCart(101, [{ choices: { "7": "8" }, quantity: 2 }]),
  ).resolves.toMatchObject({ duplicate: undefined });
});

it("rejects mock option IDs and multiple lines before any partial cart writes", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  await expect(
    addProductToCart(101, [{ choices: { color: "blue" }, quantity: 1 }]),
  ).rejects.toThrow();
  await expect(
    addProductToCart(101, [
      { choices: {}, quantity: 1 },
      { choices: {}, quantity: 2 },
    ]),
  ).rejects.toThrow();
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("reports the server cart failure and keeps restock unavailable", async () => {
  server.use(
    http.post("*/api/payments/cart/items", () =>
      mockError(500, "INTERNAL_SERVER_ERROR", "서버 오류"),
    ),
  );
  await expect(
    addProductToCart(101, [{ choices: {}, quantity: 1 }]),
  ).rejects.toMatchObject({ status: 500 });
  await expect(requestProductRestock(101)).rejects.toThrow();
});
