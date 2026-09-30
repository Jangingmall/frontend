import { describe, expect, it } from "vitest";

import { mapBackendProductCategories } from "@/api/products/backend-mapper";
import {
  backendCategoryDtos,
  backendSubcategoryDtos,
} from "@/api/products/mock/category-seed";

import { formatCategoryName, toGnbCategories } from "./gnb-categories";

describe("formatCategoryName", () => {
  it.each([
    ["다기·찻잔", "다기 · 찻잔"],
    ["컵·술병·술잔", "컵 · 술병 · 술잔"],
    ["키친 · 다이닝", "키친 · 다이닝"],
    ["제기", "제기"],
    [" 부채 ", "부채"],
  ])("%s → %s", (input, expected) => {
    expect(formatCategoryName(input)).toBe(expected);
  });
});

describe("toGnbCategories", () => {
  const tree = toGnbCategories(
    mapBackendProductCategories(backendCategoryDtos, backendSubcategoryDtos),
  );

  it("대분류 7개와 소분류 56개로 묶는다", () => {
    expect(tree).toHaveLength(7);
    expect(tree.flatMap((c) => c.subcategories)).toHaveLength(56);
  });

  it("소분류 수가 시안과 같다(9/7/12/5/8/9/6)", () => {
    expect(tree.map((c) => c.subcategories.length)).toEqual([
      9, 7, 12, 5, 8, 9, 6,
    ]);
  });

  it("응답 순서와 ID를 그대로 유지하고 표시 이름만 정규화한다", () => {
    expect(tree[0]).toMatchObject({ id: "category-1", name: "키친 · 다이닝" });
    expect(tree[0].subcategories[0]).toEqual({
      id: "subcategory-1",
      name: "다기 · 찻잔",
    });
    expect(tree[6].subcategories.at(-1)).toMatchObject({
      name: "궁중음식 · 선물세트",
    });
  });

  it("소분류가 없거나 부모가 다른 항목은 섞이지 않는다", () => {
    expect(toGnbCategories([])).toEqual([]);
  });
});
