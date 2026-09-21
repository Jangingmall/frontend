import { http, HttpResponse } from "msw";
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

it("찜 여부를 GET /wishes/{id}(204/404, 봉투 없음)로 한 번에 확인한다", async () => {
  const requestedIds: string[] = [];
  server.use(
    http.get("*/api/member/me/wishes/:productId", ({ params }) => {
      requestedIds.push(String(params.productId));
      return new HttpResponse(null, { status: 204 });
    }),
  );
  expect(await fetchProductActionState(101)).toMatchObject({ wished: true });
  expect(requestedIds).toEqual(["101"]);
});

it("404면 찜 안 한 상태로 판단한다", async () => {
  server.use(
    http.get(
      "*/api/member/me/wishes/:productId",
      () => new HttpResponse(null, { status: 404 }),
    ),
  );
  expect(await fetchProductActionState(101)).toMatchObject({ wished: false });
});

it("찜 여부 확인이 서버 오류면 안 한 상태로 조용히 넘어가지 않고 그대로 던진다", async () => {
  server.use(
    http.get("*/api/member/me/wishes/:productId", () =>
      mockError(500, "INTERNAL_ERROR"),
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
