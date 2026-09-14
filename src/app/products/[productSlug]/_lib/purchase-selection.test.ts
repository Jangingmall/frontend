import { describe, expect, it } from "vitest";

import type { ProductDetail } from "@/types/product-detail";

import {
  addSelection,
  createSelection,
  getMaxSelectionQuantity,
  getSelectionTotal,
  setSelectionQuantity,
} from "./purchase-selection";

const product = {
  id: 1,
  name: "찻잔",
  price: 10000,
  stock: 8,
  status: "ON_SALE",
  optionGroups: [
    {
      id: "size",
      label: "크기",
      required: true,
      kind: "STANDARD",
      values: [{ id: "large", label: "대", priceDelta: 9000, stock: 7 }],
    },
    {
      id: "color",
      label: "색상",
      required: true,
      kind: "STANDARD",
      values: [{ id: "white", label: "백색", priceDelta: 1000, stock: 6 }],
    },
    {
      id: "gift",
      label: "선물",
      required: false,
      kind: "GIFT",
      values: [{ id: "wrap", label: "포장", priceDelta: 2000, stock: 5 }],
    },
  ],
  variants: [
    {
      id: "large-white",
      valueIds: ["large", "white"],
      priceDelta: 3000,
      stock: 4,
    },
  ],
} as ProductDetail;
const choices = { size: "large", color: "white" };

describe("purchase selection", () => {
  it("shares variant stock between gift and unwrapped lines", () => {
    const plain = { ...createSelection(product, choices)!, quantity: 3 };
    const gift = createSelection(product, { ...choices, gift: "wrap" })!;
    expect(getMaxSelectionQuantity(product, [plain, gift], gift.key)).toBe(1);
    expect(
      setSelectionQuantity([plain, gift], gift.key, 4, product)[1].quantity,
    ).toBe(1);
  });
  it("requires every required group and rejects foreign values", () => {
    expect(createSelection(product, { size: "large" })).toBeNull();
    expect(
      createSelection(product, { ...choices, color: "foreign" }),
    ).toBeNull();
  });
  it("uses the combination surcharge once and permits no gift", () => {
    expect(createSelection(product, choices)).toMatchObject({
      unitPrice: 13000,
      stock: 4,
    });
    expect(
      createSelection(product, { ...choices, gift: "wrap" }),
    ).toMatchObject({ unitPrice: 15000, stock: 4 });
  });
  it("falls back to option deltas and minimum known stock without variants", () => {
    expect(
      createSelection({ ...product, variants: null }, choices),
    ).toMatchObject({ unitPrice: 20000, stock: 6 });
  });
  it("blocks sold out, unknown stock and unavailable combinations", () => {
    expect(createSelection({ ...product, stock: null }, choices)).toBeNull();
    expect(
      createSelection({ ...product, status: "SOLD_OUT" }, choices),
    ).toBeNull();
    expect(createSelection({ ...product, variants: [] }, choices)).toBeNull();
  });
  it("merges repeated choices up to available stock", () => {
    const line = createSelection(product, choices)!;
    const lines = addSelection([{ ...line, quantity: 3 }], line);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(4);
    expect(addSelection(lines, line)[0].quantity).toBe(4);
  });
  it("keeps gift choices distinct and totals quantities", () => {
    const plain = createSelection(product, choices)!;
    const gift = createSelection(product, { ...choices, gift: "wrap" })!;
    const lines = addSelection([plain], gift);
    expect(lines).toHaveLength(2);
    expect(getSelectionTotal(setSelectionQuantity(lines, gift.key, 2))).toBe(
      43000,
    );
  });
  it("clamps quantity to integers and rejects non-finite input", () => {
    const line = createSelection(product, choices)!;
    expect(setSelectionQuantity([line], line.key, 2.8)[0].quantity).toBe(2);
    expect(setSelectionQuantity([line], line.key, 0)[0].quantity).toBe(1);
    expect(setSelectionQuantity([line], line.key, 999)[0].quantity).toBe(4);
    expect(setSelectionQuantity([line], line.key, NaN)[0].quantity).toBe(1);
  });
  it("supports an optionless product with finite stock", () => {
    expect(
      createSelection({ ...product, optionGroups: [], variants: null }, {}),
    ).toMatchObject({ unitPrice: 10000, stock: 8, quantity: 1 });
  });
});
