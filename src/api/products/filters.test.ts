import { describe, expect, it } from "vitest";

import { toProductListSearchParams } from "./query";

describe("상품 필터 요청", () => {
  it("소재를 중복 없이 정렬하고 가격과 체크박스를 직렬화한다", () => {
    const params = toProductListSearchParams({
      materials: ["wood", "ceramic", "wood"],
      minPrice: 10000,
      maxPrice: 50000,
      hasGiftWrap: true,
      excludeSoldOut: true,
    });
    expect(params.getAll("material")).toEqual(["ceramic", "wood"]);
    expect(params.get("minPrice")).toBe("10000");
    expect(params.get("maxPrice")).toBe("50000");
    expect(params.get("hasGiftWrap")).toBe("true");
    expect(params.get("excludeSoldOut")).toBe("true");
  });

  it("유효하지 않은 가격은 요청에 넣지 않는다", () => {
    const params = toProductListSearchParams({
      minPrice: -1,
      maxPrice: Infinity,
    });
    expect(params.has("minPrice")).toBe(false);
    expect(params.has("maxPrice")).toBe(false);
  });
});
