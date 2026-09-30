import { describe, expect, it } from "vitest";

import { mapBackendProductCategories } from "@/api/products/backend-mapper";
import {
  backendCategoryDtos,
  backendSubcategoryDtos,
} from "@/api/products/mock/category-seed";

import { resolveCategoryView } from "./category-view";

const categories = mapBackendProductCategories(
  backendCategoryDtos,
  backendSubcategoryDtos,
);

describe("상품 목록 분류 해석", () => {
  it("대분류와 소분류 ID를 백엔드 분류 목록에서 찾는다", () => {
    expect(resolveCategoryView("category-1", categories)).toMatchObject({
      category: { id: "category-1", parentId: null },
      apiCategory: "category-1",
      isMapped: true,
    });
    expect(resolveCategoryView("subcategory-1", categories)).toMatchObject({
      category: { id: "subcategory-1", parentId: "category-1" },
      apiCategory: "subcategory-1",
      isMapped: true,
    });
  });

  it("분류를 지정하지 않은 전체 상품은 항상 매핑된 상태다", () => {
    expect(resolveCategoryView(undefined, [])).toMatchObject({
      category: undefined,
      isMapped: true,
    });
  });

  it.each(["오타", "category-999", "subcategory-999", "키친-다이닝", ""])(
    "알 수 없는 분류 %s는 API에 전달하지 않고 미매핑으로 처리한다",
    (id) => {
      expect(resolveCategoryView(id, categories)).toMatchObject({
        category: undefined,
        apiCategory: undefined,
        isMapped: false,
      });
    },
  );

  it("분류 목록이 아직 없으면 ID가 있어도 미매핑이다", () => {
    expect(resolveCategoryView("category-1", [])).toMatchObject({
      apiCategory: undefined,
      isMapped: false,
    });
  });
});
