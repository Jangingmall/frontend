import { describe, expect, it } from "vitest";

import { formatPriceLabel } from "./price-label";

describe("가격 필터 단위 표기", () => {
  it.each([
    [0, "0원"],
    [999, "999원"],
    [1000, "1천 원"],
    [1500, "1.5천 원"],
    [9999, "9.999천 원"],
    [10000, "1만 원"],
    [12500, "1.25만 원"],
    [100000, "10만 원"],
    [1000000, "100만 원"],
    [9990000, "999만 원"],
    [9999999, "999.9999만 원"],
  ])("%i원을 %s로 표시하고 실제 금액을 반올림하지 않는다", (price, label) => {
    expect(formatPriceLabel(price)).toBe(label);
  });
});
