import { describe, expect, it, vi } from "vitest";

import {
  parseProductSearchParams,
  updateProductSearchParams,
} from "./search-params";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

describe("상품 목록 URL", () => {
  it("종목을 소재와 독립적으로 읽고 빈 값·중복·선택 순서를 정규화한다", () => {
    expect(
      parseProductSearchParams(
        new URLSearchParams(
          "subcategory=2&subcategory=1&subcategory=2&subcategory=&material=wood",
        ),
      ),
    ).toMatchObject({ crafts: ["1", "2"], materials: ["wood"] });
  });
  it("종목 변경은 페이지를 초기화하고 나머지 조건을 유지한다", () => {
    const params = updateProductSearchParams(
      new URLSearchParams(
        "category=kitchen-1&page=3&material=wood&sort=price-desc&subcategory=3",
      ),
      { crafts: ["2", "1", "2", ""] },
    );
    expect(params.getAll("subcategory")).toEqual(["1", "2"]);
    expect(params.has("crafts")).toBe(false);
    expect(params.has("page")).toBe(false);
    expect(params.get("material")).toBe("wood");
    expect(params.get("sort")).toBe("price-desc");
    expect(parseProductSearchParams(params).category).toBe("kitchen-1");
    expect(
      updateProductSearchParams(params, { crafts: [] }).has("subcategory"),
    ).toBe(false);
  });
  it("페이지 이동은 종목을 보존하고 다른 분류로 이동하면 해제한다", () => {
    const params = new URLSearchParams(
      "category=kitchen-1&subcategory=1&subcategory=2",
    );
    expect(
      updateProductSearchParams(params, { page: 2 }).getAll("subcategory"),
    ).toEqual(["1", "2"]);
    expect(
      updateProductSearchParams(params, { category: "kitchen-2" }).has(
        "subcategory",
      ),
    ).toBe(false);
    expect(
      updateProductSearchParams(params, { category: "kitchen-1" }).getAll(
        "subcategory",
      ),
    ).toEqual(["1", "2"]);
  });
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
