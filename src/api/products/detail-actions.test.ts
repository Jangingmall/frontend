import { beforeEach, describe, expect, it, vi } from "vitest";

import { WISH_FIXTURES } from "@/api/wishlist/mock/fixtures";
import { wishlistHandlers } from "@/api/wishlist/mock/handlers";
import { publicEnv } from "@/lib/env";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import {
  addProductToCart,
  fetchProductActionState,
  requestProductRestock,
  setProductWishlist,
} from "./detail-actions";
import {
  productDetailActionHandlers,
  resetProductDetailActionState,
} from "./mock/detail-action-handlers";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

const SEED_WISH_FIXTURES = structuredClone(WISH_FIXTURES);

describe("product detail mock actions", () => {
  beforeEach(() => {
    Object.assign(publicEnv, { apiMocking: true });
    server.use(...productDetailActionHandlers, ...wishlistHandlers);
    resetProductDetailActionState();
    WISH_FIXTURES.length = 0;
    WISH_FIXTURES.push(...structuredClone(SEED_WISH_FIXTURES));
    useAuthStore.getState().setSession("mock-access-token", {
      id: 1,
      name: "테스트",
      role: "USER",
    });
  });
  it("찜 등록/취소가 실제 계약 경로(api/wishlist)로 반영된다", async () => {
    // 150은 찜 목록 시드엔 없지만 상품 카탈로그(101~240)엔 있는 id — 목업이 실제 BE처럼
    // 카탈로그에서 상품 정보를 찾아 찜에 추가한다.
    expect(await fetchProductActionState(150)).toMatchObject({ wished: false });
    await setProductWishlist(150, true);
    expect(await fetchProductActionState(150)).toMatchObject({ wished: true });
    await setProductWishlist(150, false);
    expect(await fetchProductActionState(150)).toMatchObject({ wished: false });
  });
  it("reports duplicate carts and restock subscriptions", async () => {
    const lines = [{ choices: {}, quantity: 1 }];
    expect(await addProductToCart(102, lines)).toMatchObject({
      duplicate: false,
    });
    expect(await addProductToCart(102, lines)).toMatchObject({
      duplicate: true,
    });
    expect(await requestProductRestock(103)).toMatchObject({
      duplicate: false,
    });
    expect(await requestProductRestock(103)).toMatchObject({ duplicate: true });
  });
  it("rejects invalid quantities and unavailable stock", async () => {
    await expect(
      addProductToCart(102, [{ choices: {}, quantity: 0 }]),
    ).rejects.toBeDefined();
    await expect(
      addProductToCart(103, [{ choices: {}, quantity: 1 }]),
    ).rejects.toBeDefined();
    await expect(
      addProductToCart(106, [{ choices: {}, quantity: 1 }]),
    ).rejects.toBeDefined();
  });
  it("returns unauthorized for protected requests without a token", async () => {
    const response = await fetch(
      "http://localhost:3000/api/products/101/detail-actions/restock",
      { method: "POST" },
    );
    expect(response.status).toBe(401);
  });
  it("never requests unimplemented production endpoints", async () => {
    Object.assign(publicEnv, { apiMocking: false });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(requestProductRestock(101)).rejects.toThrow("아직");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("실제 모드에서도 찜 여부를 같은 실제 경로 하나로 확인한다(데모 GET 안 탐)", async () => {
    Object.assign(publicEnv, { apiMocking: false });
    // WISH_FIXTURES엔 101이 이미 있음(시드) — 실제 계약 경로(GET /wishes/{id})로 확인.
    expect(await fetchProductActionState(101)).toEqual({
      wished: true,
      restockRequested: false,
    });
    expect(await fetchProductActionState(999999)).toEqual({
      wished: false,
      restockRequested: false,
    });
  });
});
