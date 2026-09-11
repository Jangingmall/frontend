import { expect, it } from "vitest";

import {
  productCategoriesDto,
  productMaterialsDto,
} from "@/api/products/filter-validation";
import { productListResponseDto } from "@/api/products/validation";

import {
  productCatalogue,
  productCategories,
  productMaterials,
} from "./catalogue";

it("모든 카테고리 fixture가 실제 API 검증 스키마를 만족한다", () => {
  expect(productCategoriesDto.parse(productCategories)).toEqual(
    productCategories,
  );
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
