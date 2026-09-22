import { beforeEach, expect, it } from "vitest";

import { useAuthStore } from "./auth";
import { usePurchasePreviewStore } from "./purchase-preview";
const createLine = () => ({
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
});
let line = createLine();
beforeEach(() => {
  line = createLine();
  usePurchasePreviewStore.getState().resetPreview();
});
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

it("keeps an existing combination once and allows adding it again after deletion", () => {
  const store = usePurchasePreviewStore.getState();
  expect(store.addLines([line])).toBe(false);
  expect(store.addLines([{ ...line, quantity: 3 }])).toBe(true);
  expect(usePurchasePreviewStore.getState().lines).toHaveLength(1);
  expect(usePurchasePreviewStore.getState().lines[0].quantity).toBe(2);
  store.setLines([]);
  expect(store.addLines([line])).toBe(false);
  line.options[0] = "외부 변경";
  expect(usePurchasePreviewStore.getState().lines[0].options).toEqual(["옵션"]);
});

it("clears cart and checkout when the authenticated customer changes", () => {
  useAuthStore
    .getState()
    .setSession("a", { id: 1, name: "고객1", role: "USER" });
  usePurchasePreviewStore.getState().addLines([line]);
  usePurchasePreviewStore.getState().beginCheckout([line]);
  useAuthStore
    .getState()
    .setSession("b", { id: 2, name: "고객2", role: "USER" });
  expect(usePurchasePreviewStore.getState().lines).toEqual([]);
  expect(usePurchasePreviewStore.getState().checkoutLines).toEqual([]);
  useAuthStore.getState().clear();
});
