import type { CartPreviewLine } from "@/types/purchase-preview";
export const CHECKOUT_PREVIEW_LINES: CartPreviewLine[] = [1, 2].map((id) => ({
  lineId: `checkout-${id}`,
  productId: id,
  artisanId: 1,
  artisanName: "장인 이름",
  productName: "products-name",
  thumbnail: { imageId: `preview-${id}`, variants: [] },
  options: [
    "옵션 내용 및 상세 옵션 내용",
    "옵션 내용 및 상세 옵션 내용 2",
    "옵션 내용 및 상세 옵션 내용 3",
    "옵션 내용 및 상세 옵션 내용 4",
  ],
  quantity: 1,
  unitPrice: 120000,
  maxQuantity: 10,
  soldOut: false,
  selected: true,
  note: "제작 완료 후 개별 발송됩니다. (약 2주 소요)",
}));
