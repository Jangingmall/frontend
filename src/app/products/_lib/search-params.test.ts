import { describe, expect, it } from "vitest";

import {
  parseProductSearchParams,
  updateProductSearchParams,
} from "./search-params";

describe("상품 목록 URL", () => {
  it("잘못된 페이지와 정렬 및 가격 범위를 정규화한다", () => {
    expect(
      parseProductSearchParams(
        new URLSearchParams("page=-2&sort=toString&minPrice=200&maxPrice=100"),
      ),
    ).toMatchObject({ page: 1, sort: "popular", minPrice: 100, maxPrice: 200 });
  });
  it("필터 변경은 페이지를 초기화하고 다른 URL 상태는 보존한다", () => {
    const params = updateProductSearchParams(
      new URLSearchParams("category=kitchen&page=3&keyword=접시"),
      { materials: ["wood", "ceramic"] },
    );
    expect(params.get("page")).toBeNull();
    expect(params.get("category")).toBe("kitchen");
    expect(params.get("keyword")).toBe("접시");
    expect(params.getAll("material")).toEqual(["ceramic", "wood"]);
  });
  it("페이지 이동은 기존 필터를 보존한다", () => {
    expect(
      updateProductSearchParams(
        new URLSearchParams("material=wood&hasGiftWrap=true"),
        { page: 2 },
      ).toString(),
    ).toBe("material=wood&hasGiftWrap=true&page=2");
  });
});
