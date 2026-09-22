import type { CartPreviewLine } from "./purchase-preview";
export interface CartSection {
  artisanId: number;
  artisanName: string;
  shippingFee: number;
  freeShippingThreshold: number | null;
}
export interface CartItemInput {
  productId: number;
  quantity: number;
  selectedOptions?: { optionGroupId: number; choiceId: number }[];
  textInputs?: { optionGroupId: number; text: string }[];
}
export interface CartLine extends CartPreviewLine {
  selectedOptions: NonNullable<CartItemInput["selectedOptions"]>;
  textInputs: NonNullable<CartItemInput["textInputs"]>;
}
export interface Cart {
  lines: CartLine[];
  sections: CartSection[];
  totalPrice: number;
  totalShippingFee: number;
  totalCount: number;
}
export function getCartShippingAmount(
  sections: CartSection[],
  lines: CartPreviewLine[],
) {
  return sections.reduce((total, section) => {
    const subtotal = lines
      .filter(
        (line) =>
          line.artisanId === section.artisanId &&
          line.selected &&
          !line.soldOut,
      )
      .reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    return (
      total +
      (subtotal === 0 ||
      (section.freeShippingThreshold !== null &&
        subtotal >= section.freeShippingThreshold)
        ? 0
        : section.shippingFee)
    );
  }, 0);
}
