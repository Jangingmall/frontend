import { expect, it } from "vitest";

import { getCartOptions } from "./cart-fixtures";
import { isOptionComplete, updateOptionDraft } from "./cart-options";
it("changing predecessor clears incompatible dependent values", () => {
  const options = getCartOptions(1);
  const changed = updateOptionDraft(
    ["백자토", "중", "무광", "선택 안 함"],
    0,
    "청자토",
    options,
  );
  expect(changed).toEqual(["청자토", "", "", ""]);
  expect(isOptionComplete(changed, options)).toBe(false);
});
it("valid complete reselection and no-gift selection count as complete", () => {
  const options = getCartOptions(1);
  const changed = updateOptionDraft(
    ["백자토", "대", "무광", "선택 안 함"],
    0,
    "청자토",
    options,
  );
  expect(isOptionComplete(changed, options)).toBe(true);
});
