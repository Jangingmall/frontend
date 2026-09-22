import type { CreateOrderInput, PaymentContext } from "@/types/payment";
export function parseCartItemIds(value: string | null): number[] {
  if (!value || !/^\d+(,\d+)*$/.test(value)) return [];
  const ids = value.split(",").map(Number);
  return ids.every((id) => Number.isSafeInteger(id) && id > 0) &&
    new Set(ids).size === ids.length
    ? ids
    : [];
}
export function getOrderRequestKey(input: CreateOrderInput, snapshot = "") {
  const storageKey = `checkout-request:${JSON.stringify({ input, snapshot })}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, key);
  return key;
}
export function savePaymentContext(context: PaymentContext) {
  sessionStorage.setItem(
    `payment:${context.orderNumber}`,
    JSON.stringify(context),
  );
}
export function readPaymentContext(orderNumber: string): PaymentContext | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(`payment:${orderNumber}`) ?? "null",
    );
    return value &&
      Number.isSafeInteger(value.orderId) &&
      value.orderId > 0 &&
      value.orderNumber === orderNumber &&
      Number.isSafeInteger(value.amount) &&
      value.amount > 0
      ? value
      : null;
  } catch {
    return null;
  }
}
export function validatePaymentCallback(
  params: URLSearchParams,
  saved: PaymentContext | null,
) {
  const amount = Number(params.get("amount"));
  const orderId = params.get("orderId");
  const paymentKey = params.get("paymentKey");
  if (
    !saved ||
    !paymentKey ||
    paymentKey.length > 200 ||
    orderId !== saved.orderNumber ||
    amount !== saved.amount
  )
    throw new Error(
      "결제 요청 정보가 일치하지 않습니다. 주문 내역을 확인해 주세요.",
    );
  return { paymentKey, orderId, amount };
}
export function isPaidOrder(status: string) {
  return ["PAID", "IN_DELIVERY", "DELIVERED"].includes(status);
}

export function clearOrderRequestKey(key: string) {
  for (let index = sessionStorage.length - 1; index >= 0; index--) {
    const storageKey = sessionStorage.key(index);
    if (
      storageKey?.startsWith("checkout-request:") &&
      sessionStorage.getItem(storageKey) === key
    )
      sessionStorage.removeItem(storageKey);
  }
}
