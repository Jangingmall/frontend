import type { ImageRef } from "@/types/image";
export const PURCHASE_PREVIEW_ORDER_ID = "ui-preview-order";
export type PreviewPaymentMethod =
  "REALTIME_TRANSFER" | "BANK_TRANSFER" | "CARD" | "TOSS_PAY";
export type PreviewPaymentOutcome =
  "success" | "bank-pending" | "declined" | "timeout" | "cancelled";
export interface CartPreviewLine {
  lineId: string;
  productId: number;
  artisanId: number;
  artisanName: string;
  productName: string;
  thumbnail: ImageRef;
  options: string[];
  quantity: number;
  unitPrice: number;
  maxQuantity: number;
  soldOut: boolean;
  selected: boolean;
  note?: string;
}
export interface PurchasePreviewState {
  lines: CartPreviewLine[];
  checkoutLines: CartPreviewLine[];
  setLines: (lines: CartPreviewLine[]) => void;
  beginCheckout: (selectedLines: CartPreviewLine[]) => void;
  resetPreview: () => void;
}
