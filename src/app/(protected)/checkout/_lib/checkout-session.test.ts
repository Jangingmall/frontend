import { beforeEach, expect, it } from "vitest";

import {
  clearOrderRequestKey,
  getOrderRequestKey,
  isPaidOrder,
  parseCartItemIds,
  validatePaymentCallback,
} from "./checkout-session";
beforeEach(() => sessionStorage.clear());
it("rejects missing, duplicate or nonnumeric selected cart IDs", () => {
  expect(parseCartItemIds(null)).toEqual([]);
  expect(parseCartItemIds("1,2")).toEqual([1, 2]);
  expect(parseCartItemIds("1,bad")).toEqual([]);
  expect(parseCartItemIds("1,1")).toEqual([]);
});
it("keeps request key across reload and changes it for a different payload", () => {
  const payload = {
    cartItemIds: [1],
    addressId: 2,
    deliveryRequest: "",
    paymentMethod: "CARD" as const,
  };
  expect(getOrderRequestKey(payload)).toBe(getOrderRequestKey(payload));
  expect(getOrderRequestKey({ ...payload, addressId: 3 })).not.toBe(
    getOrderRequestKey(payload),
  );
});
it("rejects forged callbacks or lost browser context", () => {
  const saved = { orderId: 12, orderNumber: "ORD-12345", amount: 5000 };
  expect(
    validatePaymentCallback(
      new URLSearchParams("orderId=ORD-12345&amount=5000&paymentKey=key"),
      saved,
    ),
  ).toEqual({ paymentKey: "key", orderId: "ORD-12345", amount: 5000 });
  expect(() =>
    validatePaymentCallback(
      new URLSearchParams("orderId=12&amount=5000&paymentKey=key"),
      saved,
    ),
  ).toThrow();
  expect(() =>
    validatePaymentCallback(
      new URLSearchParams("orderId=ORD-12345&amount=1&paymentKey=key"),
      saved,
    ),
  ).toThrow();
  expect(() => validatePaymentCallback(new URLSearchParams(), null)).toThrow();
});
it("never treats created, failed or canceled orders as paid", () => {
  expect(isPaidOrder("CREATED")).toBe(false);
  expect(isPaidOrder("PAYMENT_FAILED")).toBe(false);
  expect(isPaidOrder("CANCELED")).toBe(false);
  expect(isPaidOrder("PAID")).toBe(true);
});

it("rotates only a terminal request and differentiates quantity snapshots", () => {
  const input = {
    cartItemIds: [1],
    addressId: 2,
    deliveryRequest: "",
    paymentMethod: "CARD" as const,
  };
  const old = getOrderRequestKey(input, "quantity:1");
  expect(getOrderRequestKey(input, "quantity:2")).not.toBe(old);
  clearOrderRequestKey(old);
  expect(getOrderRequestKey(input, "quantity:1")).not.toBe(old);
});
