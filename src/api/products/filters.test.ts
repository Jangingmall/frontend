import { describe, expect, it, vi } from "vitest";

import { productKeys } from "@/queries/products/keys";

import { toProductListSearchParams } from "./query";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

describe("상품 필터 요청", () => {
  it("종목을 반복 subcategory로 보내고 순서가 다른 선택도 같은 캐시를 사용한다", () => {
    const query = {
      category: "kitchen-1",
      crafts: ["2", "1", "2", ""],
      materials: ["wood"],
    };
    const params = toProductListSearchParams(query);
    expect(params.getAll("subcategory")).toEqual(["1", "2"]);
    expect(params.getAll("material")).toEqual(["wood"]);
    expect(productKeys.list(query)).toEqual(
      productKeys.list({ ...query, crafts: ["1", "2"] }),
    );
    expect(productKeys.list(query)).not.toEqual(
      productKeys.list({ ...query, crafts: ["1"] }),
    );
  });
  it("품절 제외 체크 해제를 서버 기본값에 맡기지 않는다", () => {
    expect(toProductListSearchParams({}).get("excludeSoldOut")).toBe("false");
  });
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
