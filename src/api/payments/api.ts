import { clientFetch } from "@/lib/http/client";
import type { CreateOrderInput, PaymentMethod } from "@/types/payment";

import { orderSchema, paymentSchema, preparedSchema } from "./validation";
export async function createOrder(input: CreateOrderInput, key: string) {
  return orderSchema.parse(
    await clientFetch("/api/payments/orders", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: input,
    }),
  );
}
export async function preparePayment(input: {
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
}) {
  return preparedSchema.parse(
    await clientFetch("/api/payments", { method: "POST", body: input }),
  );
}
export async function confirmPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  return paymentSchema.parse(
    await clientFetch("/api/payments/confirm", { method: "POST", body: input }),
  );
}
export async function failPayment(input: {
  orderId: string;
  errorCode: string;
  errorMessage: string;
}) {
  await clientFetch("/api/payments/fail", { method: "POST", body: input });
}
export async function fetchPaymentOrder(orderId: number) {
  return orderSchema.parse(
    await clientFetch(`/api/member/me/orders/${orderId}`),
  );
}
