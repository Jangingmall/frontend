import { ApiError } from "@/lib/http/api-error";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";
import type { ProductCategory } from "@/types/product-filter";

import {
  backendCategoriesDto,
  backendProductListDto,
  backendSubcategoriesDto,
} from "./backend-validation";
export function mapBackendProductList(data: unknown): Page<ProductSummary> {
  const dto = backendProductListDto.parse(data);
  return {
    items: dto.content.map((item) => ({
      id: item.productId,
      name: item.title,
      price: item.price,
      thumbnail: null,
      thumbnailUrl: item.thumbnailUrl || null,
      artisan: { id: item.artisanId, name: null },
      craftCategory: null,
      rating: null,
      reviewCount: null,
      primaryBadge: null,
      isSoldOut: false,
    })),
    page: dto.number + 1,
    pageSize: dto.size,
    totalCount: dto.totalElements,
    totalPages: Math.max(1, dto.totalPages),
  };
}
export function mapBackendProductCategories(
  data: unknown,
  subcategories: unknown = [],
): ProductCategory[] {
  const parents = backendCategoriesDto.parse(data),
    children = backendSubcategoriesDto.parse(subcategories);
  const ids = new Set(parents.map((p) => p.categoryId));
  if (
    ids.size !== parents.length ||
    new Set(children.map((c) => c.subcategoryId)).size !== children.length ||
    children.some((c) => !ids.has(c.categoryId))
  )
    throw new ApiError(502, { errorCode: "PRODUCT_CATEGORY_MAPPING_INVALID" });
  // 가격 범위는 UI 입력 한도이며, 상품 집계 데이터가 아니다.
  const defaults = { description: "", minPrice: 0, maxPrice: 9990000 };
  return [
    ...parents.map((p) => ({
      ...defaults,
      id: `category-${p.categoryId}`,
      name: p.name,
      parentId: null,
      apiCode: String(p.categoryId),
    })),
    ...children.map((c) => ({
      ...defaults,
      id: `subcategory-${c.subcategoryId}`,
      name: c.name,
      parentId: `category-${c.categoryId}`,
      apiCode: String(c.subcategoryId),
    })),
  ];
}
export function resolveProductCategoryCode(
  category: string,
  categories: ProductCategory[],
) {
  const code = categories.find((c) => c.id === category)?.apiCode;
  if (!code)
    throw new ApiError(503, { errorCode: "PRODUCT_CATEGORY_NOT_MAPPED" });
  return code;
}
