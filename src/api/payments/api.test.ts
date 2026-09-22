import { expect, it, vi } from "vitest";

import { clientFetch } from "@/lib/http/client";

import {
  confirmPayment,
  createOrder,
  failPayment,
  fetchPaymentOrder,
  preparePayment,
} from "./api";
vi.mock("@/lib/http/client", () => ({ clientFetch: vi.fn() }));
const order = {
  orderId: 42,
  orderNumber: "ORD-12345",
  totalAmount: 5000,
  status: "CREATED",
  createdAt: "2026-09-20T00:00:00Z",
};
it("sends idempotency key and only backend checkout fields", async () => {
  vi.mocked(clientFetch).mockResolvedValueOnce(order);
  const input = {
    cartItemIds: [1],
    addressId: 2,
    deliveryRequest: "문 앞",
    paymentMethod: "CARD" as const,
  };
  await expect(createOrder(input, "same-key")).resolves.toEqual(order);
  expect(clientFetch).toHaveBeenLastCalledWith("/api/payments/orders", {
    method: "POST",
    headers: { "Idempotency-Key": "same-key" },
    body: input,
  });
});
it("uses numeric database ID to prepare and gateway order number to confirm/fail", async () => {
  vi.mocked(clientFetch).mockResolvedValueOnce({
    paymentId: 3,
    orderId: 42,
    amount: 5000,
    tossClientKey: "",
    created: true,
  });
  await preparePayment({
    orderId: 42,
    amount: 5000,
    paymentMethod: "TRANSFER",
  });
  expect(clientFetch).toHaveBeenLastCalledWith("/api/payments", {
    method: "POST",
    body: { orderId: 42, amount: 5000, paymentMethod: "TRANSFER" },
  });
  vi.mocked(clientFetch).mockResolvedValueOnce({
    paymentId: 3,
    orderId: 42,
    orderNumber: "ORD-12345",
    amount: 5000,
    status: "DONE",
  });
  await confirmPayment({
    paymentKey: "key",
    orderId: "ORD-12345",
    amount: 5000,
  });
  expect(clientFetch).toHaveBeenLastCalledWith("/api/payments/confirm", {
    method: "POST",
    body: { paymentKey: "key", orderId: "ORD-12345", amount: 5000 },
  });
  await failPayment({
    orderId: "ORD-12345",
    errorCode: "USER_CANCEL",
    errorMessage: "취소",
  });
  expect(clientFetch).toHaveBeenLastCalledWith("/api/payments/fail", {
    method: "POST",
    body: {
      orderId: "ORD-12345",
      errorCode: "USER_CANCEL",
      errorMessage: "취소",
    },
  });
});
it("fetches persisted order on completion/reload, never trusts query result", async () => {
  vi.mocked(clientFetch).mockResolvedValueOnce({
    ...order,
    status: "PAYMENT_FAILED",
  });
  expect((await fetchPaymentOrder(42)).status).toBe("PAYMENT_FAILED");
  expect(clientFetch).toHaveBeenLastCalledWith("/api/member/me/orders/42");
});
it("surfaces errors and rejects malformed order data", async () => {
  vi.mocked(clientFetch).mockRejectedValueOnce(new Error("stock unavailable"));
  await expect(
    createOrder(
      {
        cartItemIds: [1],
        addressId: 2,
        deliveryRequest: "",
        paymentMethod: "CARD",
      },
      "key",
    ),
  ).rejects.toThrow("stock unavailable");
  vi.mocked(clientFetch).mockResolvedValueOnce({
    ...order,
    orderId: "ORD-12345",
  });
  await expect(fetchPaymentOrder(42)).rejects.toThrow();
});
