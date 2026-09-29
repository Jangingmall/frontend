import { expect, it } from "vitest";

import {
  backendCategoriesDto,
  backendSubcategoriesDto,
} from "@/api/products/backend-validation";
import { productMaterialsDto } from "@/api/products/filter-validation";
import { productListResponseDto } from "@/api/products/validation";

import { productCatalogue, productMaterials } from "./catalogue";
import { backendCategoryDtos, backendSubcategoryDtos } from "./category-seed";

it("분류 시드가 백엔드 응답 검증 스키마를 만족하고 대분류 7·소분류 56이다", () => {
  expect(backendCategoriesDto.parse(backendCategoryDtos)).toHaveLength(7);
  expect(backendSubcategoriesDto.parse(backendSubcategoryDtos)).toHaveLength(
    56,
  );
  const parentIds = new Set(backendCategoryDtos.map((c) => c.categoryId));
  expect(
    backendSubcategoryDtos.every((sub) => parentIds.has(sub.categoryId)),
  ).toBe(true);
});

it("모든 소재 fixture가 실제 API 검증 스키마를 만족한다", () => {
  expect(productMaterialsDto.parse(productMaterials)).toEqual(productMaterials);
});

it("페이지 밖 상품까지 전체 fixture의 응답 계약을 검증한다", () => {
  const payload = {
    items: productCatalogue,
    totalCount: productCatalogue.length,
  };
  expect(productListResponseDto.parse(payload)).toEqual(payload);
});
