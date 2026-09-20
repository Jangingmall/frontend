import { describe, expect, it } from "vitest";

import { mapBackendProductCategories } from "@/api/products/backend-mapper";
import { productCategories } from "@/api/products/mock/catalogue";

import { PRODUCT_NAV_CATEGORIES, resolveCategoryView } from "./category-view";

describe("헤더와 상품목록 분류", () => {
  it("백엔드가 이전 분류여도 헤더 분류와 9개 소분류를 표시한다", () => {
    const view = resolveCategoryView(
      "키친-다이닝",
      mapBackendProductCategories([{ categoryId: 1, name: "도자기" }]),
    );
    expect(view.category?.name).toBe("키친 · 다이닝");
    expect(
      view.categories.filter((c) => c.parentId === view.category?.id),
    ).toHaveLength(9);
    expect(view.isMapped).toBe(false);
    expect(view.apiCategory).toBeUndefined();
  });

  it("MSW 분류는 이름과 부모를 확인해서 기존 ID로 연결한다", () => {
    expect(
      resolveCategoryView("키친-다이닝", productCategories).apiCategory,
    ).toBe("kitchen");
    expect(
      resolveCategoryView("다기-찻잔", productCategories).apiCategory,
    ).toBe("kitchen-1");
    expect(resolveCategoryView("홈-인테리어", productCategories).isMapped).toBe(
      false,
    );
  });

  it("새 백엔드 분류는 서버 ID를 사용하고 다른 부모의 동명 소분류는 연결하지 않는다", () => {
    const categories = mapBackendProductCategories(
      [
        { categoryId: 17, name: "키친·다이닝" },
        { categoryId: 18, name: "도자기" },
      ],
      [
        { subcategoryId: 31, categoryId: 17, name: "다기·찻잔" },
        { subcategoryId: 32, categoryId: 18, name: "다기·찻잔" },
      ],
    );
    expect(resolveCategoryView("키친-다이닝", categories).apiCategory).toBe(
      "category-17",
    );
    expect(resolveCategoryView("다기-찻잔", categories).apiCategory).toBe(
      "subcategory-31",
    );
  });

  it("전체 상품과 기존 ID는 유지하며 모든 헤더 대분류를 제공한다", () => {
    expect(resolveCategoryView(undefined, []).isMapped).toBe(true);
    expect(resolveCategoryView("category-1", []).apiCategory).toBe(
      "category-1",
    );
    expect(
      PRODUCT_NAV_CATEGORIES.filter((c) => c.parentId === null),
    ).toHaveLength(7);
  });
});
