import { describe, expect, it } from "vitest";

import { productBadgeLabel } from "@/constants/badge";
import {
  DEFAULT_PRODUCT_LIST_SORT,
  PRODUCT_LIST_SORT,
  toProductListSortApi,
} from "@/types/sort";

import { mapProductListPage, mapProductSummary } from "./mapper";
import { productListEmpty, productListPage1 } from "./mock/fixtures";

describe("mapProductSummary", () => {
  it("SOLD_OUT을 isSoldOut으로 파생하고 배지 값은 보존한다", () => {
    const soldOut = mapProductSummary(productListPage1.items[2]);
    expect(soldOut.isSoldOut).toBe(true);
    expect(soldOut.primaryBadge).toBeNull();

    const onSale = mapProductSummary(productListPage1.items[0]);
    expect(onSale.isSoldOut).toBe(false);
    expect(onSale.primaryBadge).toBe("LIMITED");
  });

  it("craftCategory가 없으면 null로 정규화한다", () => {
    const mapped = mapProductSummary({
      ...productListPage1.items[0],
      craftCategory: undefined,
    });
    expect(mapped.craftCategory).toBeNull();
  });
});

describe("mapProductListPage", () => {
  it("페이지 정보는 요청 인자에서 채운다", () => {
    const page = mapProductListPage(productListPage1, { page: 2, size: 20 });
    expect(page).toMatchObject({ page: 2, pageSize: 20, totalCount: 3 });
    expect(page.items).toHaveLength(3);
  });

  it("totalPages를 계산한다", () => {
    expect(
      mapProductListPage(productListEmpty, { page: 1, size: 20 }).totalPages,
    ).toBe(1);
    expect(
      mapProductListPage({ items: [], totalCount: 21 }, { page: 1, size: 20 })
        .totalPages,
    ).toBe(2);
  });
});

describe("상품 정렬 매핑", () => {
  it("URL 표현 ↔ API enum이 왕복한다", () => {
    for (const [url, api] of Object.entries(PRODUCT_LIST_SORT)) {
      expect(toProductListSortApi(url)).toBe(api);
    }
  });

  it("모르는 값·빈 값은 기본 정렬로 폴백한다", () => {
    const fallback = PRODUCT_LIST_SORT[DEFAULT_PRODUCT_LIST_SORT];
    expect(toProductListSortApi("nope")).toBe(fallback);
    expect(toProductListSortApi(null)).toBe(fallback);
    expect(toProductListSortApi(undefined)).toBe(fallback);
  });

  it("Object.prototype 상속 키도 기본 정렬로 폴백한다", () => {
    const fallback = PRODUCT_LIST_SORT[DEFAULT_PRODUCT_LIST_SORT];
    expect(toProductListSortApi("toString")).toBe(fallback);
    expect(toProductListSortApi("constructor")).toBe(fallback);
    expect(toProductListSortApi("hasOwnProperty")).toBe(fallback);
  });
});

describe("productBadgeLabel", () => {
  it("알려진 값은 한글 라벨로, 모르는 값·null은 undefined로", () => {
    expect(productBadgeLabel("LIMITED")).toBe("한정수량");
    expect(productBadgeLabel("NEW")).toBe("신작");
    expect(productBadgeLabel("POPULAR")).toBe("인기");
    expect(productBadgeLabel("SOMETHING_NEW")).toBeUndefined();
    expect(productBadgeLabel(null)).toBeUndefined();
    expect(productBadgeLabel(undefined)).toBeUndefined();
  });
});
