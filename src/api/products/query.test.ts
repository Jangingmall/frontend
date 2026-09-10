import { describe, expect, it } from "vitest";

import {
  DEFAULT_PRODUCT_LIST_SIZE,
  MAX_PRODUCT_LIST_SIZE,
  resolveProductListPaging,
  toProductListSearchParams,
} from "./query";

describe("resolveProductListPaging", () => {
  it("값이 없으면 기본값을 쓴다", () => {
    expect(resolveProductListPaging({})).toEqual({
      page: 1,
      size: DEFAULT_PRODUCT_LIST_SIZE,
    });
  });

  it("정상 값은 그대로 통과시킨다", () => {
    expect(resolveProductListPaging({ page: 3, size: 40 })).toEqual({
      page: 3,
      size: 40,
    });
  });

  it("0·음수·소수는 계약 범위로 정규화한다", () => {
    expect(resolveProductListPaging({ page: 0, size: 0 })).toEqual({
      page: 1,
      size: 1,
    });
    expect(resolveProductListPaging({ page: -5, size: -1 })).toEqual({
      page: 1,
      size: 1,
    });
    expect(resolveProductListPaging({ page: 2.9, size: 20.9 })).toEqual({
      page: 2,
      size: 20,
    });
  });

  it("NaN·Infinity는 기본값으로 흡수한다", () => {
    expect(resolveProductListPaging({ page: NaN, size: Infinity })).toEqual({
      page: 1,
      size: DEFAULT_PRODUCT_LIST_SIZE,
    });
  });

  it("size 상한(100)을 넘으면 상한으로 자른다", () => {
    expect(resolveProductListPaging({ size: 500 }).size).toBe(
      MAX_PRODUCT_LIST_SIZE,
    );
  });
});

describe("toProductListSearchParams", () => {
  it("정규화된 page·size와 정렬 enum을 싣는다", () => {
    const params = toProductListSearchParams({
      page: 0,
      size: 999,
      sort: "newest",
    });
    expect(params.get("page")).toBe("1");
    expect(params.get("size")).toBe(String(MAX_PRODUCT_LIST_SIZE));
    expect(params.get("sort")).toBe("NEWEST");
  });

  it("빈 keyword·category는 싣지 않는다", () => {
    const params = toProductListSearchParams({ keyword: "", category: "" });
    expect(params.has("keyword")).toBe(false);
    expect(params.has("category")).toBe(false);
  });

  it("keyword·category가 있으면 싣는다", () => {
    const params = toProductListSearchParams({
      keyword: "다기",
      category: "키친-다이닝",
    });
    expect(params.get("keyword")).toBe("다기");
    expect(params.get("category")).toBe("키친-다이닝");
  });
});
