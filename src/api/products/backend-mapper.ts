import { GNB_CATEGORIES, toGnbCategoryCode } from "@/constants/gnb-category";
import { ApiError } from "@/lib/http/api-error";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";
import type { ProductCategory } from "@/types/product-filter";

import {
  backendCategoriesDto,
  backendProductListDto,
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
      artisan: { id: item.artisanId, name: item.artisanName ?? null },
      craftCategory: null,
      rating: item.rating ?? null,
      reviewCount: item.reviewCount ?? null,
      primaryBadge: item.primaryBadge ?? null,
      isSoldOut: item.status === "SOLD_OUT",
      // TODO 색상 코드→표시 색상 합의 전에는 WHITE 등 문자열의 임의 색상 칩을 만들지 않는다.
    })),
    page: dto.number + 1,
    pageSize: dto.size,
    totalCount: dto.totalElements,
    totalPages: Math.max(1, dto.totalPages),
  };
}

export function mapBackendProductCategories(data: unknown): ProductCategory[] {
  const options = backendCategoriesDto.parse(data);
  const byName = new Map(
    options.map((item) => [toGnbCategoryCode(item.name), item.code]),
  );
  if (
    byName.size !== options.length ||
    new Set(options.map((item) => item.code)).size !== options.length
  ) {
    throw new ApiError(502, { errorCode: "PRODUCT_CATEGORY_MAPPING_INVALID" });
  }
  // 계층·URL은 기존 PD/GNB 정의에서 가져온다. BE에 설명·parentId·가격 집계를 새로 요구하지 않는다.
  const categories = GNB_CATEGORIES.flatMap((parent) => {
    const parentId = toGnbCategoryCode(parent.name);
    return [
      { name: parent.name, parentId: null },
      ...parent.subcategories.map((child) => ({ name: child.name, parentId })),
    ];
  });
  return categories.map((category) => {
    const id = toGnbCategoryCode(category.name);
    return {
      id,
      name: category.name,
      parentId: category.parentId,
      description: "",
      // Figma 가격 슬라이더의 UI 범위이며 상품 가격 통계가 아니다.
      minPrice: 1000,
      maxPrice: 9990000,
      apiCode: byName.get(id),
    };
  });
}

export function resolveProductCategoryCode(
  category: string,
  categories: ProductCategory[],
): string {
  const code = categories.find((item) => item.id === category)?.apiCode;
  if (!code) {
    // 미매핑 분류를 무필터 전체 조회로 바꾸면 URL과 결과가 달라진다.
    throw new ApiError(503, { errorCode: "PRODUCT_CATEGORY_NOT_MAPPED" });
  }
  return code;
}
