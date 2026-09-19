import { expect, it } from "vitest";

import { cartFixtures } from "./cart-fixtures";
import {
  changeQuantity,
  getSelectedAmount,
  removeLines,
  restoreLines,
  setSelection,
} from "./cart-selection";
it("select all excludes sold out and group selection does not affect another artisan", () => {
  const mixed = cartFixtures.mixed;
  const all = setSelection(mixed, true);
  expect(all.filter((line) => line.selected)).toHaveLength(2);
  expect(all.find((line) => line.soldOut)?.selected).toBe(false);
  const group = setSelection(all, false, 1);
  expect(
    group.filter((line) => line.selected).map((line) => line.artisanId),
  ).toEqual([2]);
});
it("quantity is clamped and selected amount reflects it", () => {
  const changed = changeQuantity(cartFixtures.base, "cart-1", 999);
  expect(changed[0].quantity).toBe(changed[0].maxQuantity);
  expect(getSelectedAmount(changed)).toBe(
    changed[0].maxQuantity * changed[0].unitPrice + changed[1].unitPrice,
  );
  expect(changeQuantity(changed, "cart-1", 0)[0].quantity).toBe(1);
});
it("remove final line yields empty and undo restores original order without overwriting retained edits", () => {
  const lines = cartFixtures.base;
  const removed = removeLines(lines, [lines[0].lineId, lines[2].lineId]);
  const edited = changeQuantity(removed.remaining, lines[1].lineId, 2);
  const restored = restoreLines(edited, removed.snapshot);
  expect(restored.map((line) => line.lineId)).toEqual(
    lines.map((line) => line.lineId),
  );
  expect(restored[1].quantity).toBe(2);
  expect(removeLines([lines[0]], [lines[0].lineId]).remaining).toEqual([]);
});
