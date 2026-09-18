import { beforeEach, expect, it } from "vitest";

import { usePurchasePreviewStore } from "./purchase-preview";
const line = {
  lineId: "a",
  productId: 1,
  artisanId: 1,
  artisanName: "장인",
  productName: "작품",
  thumbnail: { imageId: "sample", variants: [] },
  options: ["옵션"],
  quantity: 2,
  unitPrice: 1000,
  maxQuantity: 3,
  soldOut: false,
  selected: true,
};
beforeEach(() => usePurchasePreviewStore.getState().resetPreview());
it("checkout copies only selected purchasable lines without sharing nested data", () => {
  const lines = [
    line,
    { ...line, lineId: "sold", soldOut: true },
    { ...line, lineId: "unselected", selected: false },
  ];
  usePurchasePreviewStore.getState().beginCheckout(lines);
  lines[0].options[0] = "변경";
  expect(usePurchasePreviewStore.getState().checkoutLines).toHaveLength(1);
  expect(usePurchasePreviewStore.getState().checkoutLines[0].options).toEqual([
    "옵션",
  ]);
});
it("reset clears cart and checkout memory", () => {
  usePurchasePreviewStore.getState().setLines([line]);
  usePurchasePreviewStore.getState().beginCheckout([line]);
  usePurchasePreviewStore.getState().resetPreview();
  expect(usePurchasePreviewStore.getState().lines).toEqual([]);
  expect(usePurchasePreviewStore.getState().checkoutLines).toEqual([]);
});
