import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("product detail mock actions", () => {
  beforeEach(() => {
    Object.assign(publicEnv, { apiMocking: true });
    server.use(...productDetailActionHandlers);
    resetProductDetailActionState();
    useAuthStore.getState().setSession("mock-access-token", {
      id: 1,
      name: "테스트",
      roles: ["USER"],
    });
  });
  it("persists wishlist state per product and user", async () => {
    await setProductWishlist(101, true);
    expect(await fetchProductActionState(101)).toMatchObject({ wished: true });
    expect(await fetchProductActionState(102)).toMatchObject({ wished: false });
    useAuthStore.getState().setAccessToken("mock-access-token-user2");
    expect(await fetchProductActionState(101)).toMatchObject({ wished: false });
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
      "http://localhost:3000/api/products/101/detail-actions/wishlist",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wished: true }),
      },
    );
    expect(response.status).toBe(401);
  });
  it("never requests unimplemented production endpoints", async () => {
    Object.assign(publicEnv, { apiMocking: false });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(setProductWishlist(101, true)).rejects.toThrow("아직");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
