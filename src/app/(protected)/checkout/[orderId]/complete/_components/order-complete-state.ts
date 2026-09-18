import {
  type PreviewPaymentOutcome,
  PURCHASE_PREVIEW_ORDER_ID,
} from "@/types/purchase-preview";

export type OrderCompleteOutcome = Extract<
  PreviewPaymentOutcome,
  "success" | "bank-pending"
>;

export function resolveOrderCompleteOutcome(
  orderId: string,
  result: string | string[] | undefined,
  isMockMode: boolean,
): OrderCompleteOutcome | null {
  if (!isMockMode || orderId !== PURCHASE_PREVIEW_ORDER_ID) return null;
  if (result === undefined || result === "success") return "success";
  if (result === "bank-pending") return "bank-pending";
  return null;
}
