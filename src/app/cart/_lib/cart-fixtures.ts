import type { CartPreviewLine } from "@/types/purchase-preview";
const sample = (
  n: number,
  artisanId: number,
  selected: boolean,
): CartPreviewLine => ({
  lineId: `cart-${n}`,
  productId: n,
  artisanId,
  artisanName: artisanId === 1 ? "김도윤 장인" : "이서연 장인",
  productName: ["백자 달항아리", "백자 찻잔", "나전 보석함"][n - 1],
  thumbnail: { imageId: "preview-placeholder", variants: [] },
  options:
    n === 1 ? ["백자토", "중", "무광", "선택 안 함"] : ["기본", "선택 안 함"],
  quantity: 1,
  unitPrice: [320000, 45000, 180000][n - 1],
  maxQuantity: 5,
  soldOut: false,
  selected,
  note: "제작 완료 후 개별 발송됩니다. (약 4주 소요)",
});
const base = [sample(1, 1, true), sample(2, 1, true), sample(3, 2, false)];
export const cartFixtures = {
  base,
  mixed: base.map((line, index) => ({
    ...line,
    soldOut: index === 1,
    selected: index !== 1,
  })),
  soldOut: base.map((line) => ({ ...line, soldOut: true, selected: false })),
  empty: [] as CartPreviewLine[],
};
export const CART_PREVIEW_SHIPPING_AMOUNT = 0;
export interface CartOptionDefinition {
  label: string;
  values: string[];
  available?: (selected: string[]) => string[];
  gift?: boolean;
}
export const getCartOptions = (productId: number): CartOptionDefinition[] =>
  productId === 1
    ? [
        { label: "필수 옵션 1", values: ["백자토", "청자토"] },
        {
          label: "필수 옵션 2",
          values: ["중", "대"],
          available: (values) =>
            values[0] === "청자토" ? ["대"] : ["중", "대"],
        },
        { label: "필수 옵션 3", values: ["무광", "유광"] },
        { label: "선물 옵션", values: ["선택 안 함", "선물 포장"], gift: true },
      ]
    : [
        { label: "필수 옵션 1", values: ["기본", "고급"] },
        { label: "선물 옵션", values: ["선택 안 함", "선물 포장"], gift: true },
      ];
