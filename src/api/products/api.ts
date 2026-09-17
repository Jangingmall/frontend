import { publicEnv } from "@/lib/env";
import { fetchPublicApi } from "@/lib/http/fetcher";
import { isrTags } from "@/lib/isr/tags";
import type { Page } from "@/types/api";

import {
  mapBackendProductCategories,
  mapBackendProductList,
  resolveProductCategoryCode,
} from "./backend-mapper";
import { productCategoriesDto } from "./filter-validation";
import { assertProductListApiReady } from "./integration";
import { mapProductCategories, mapProductListPage } from "./mapper";
import type { ProductSummary } from "./model";
import {
  type ProductListQuery,
  resolveProductListPaging,
  toProductListSearchParams,
} from "./query";
import { productListResponseDto } from "./validation";

/** 웹훅 유실 대비 안전망(1시간). 이벤트 기반 재검증이 우선이다. (docs/isr.md §2) */
const PRODUCT_LIST_REVALIDATE = 3600;

export async function fetchProductCategoriesServer() {
  assertProductListApiReady();
  const dto = await fetchPublicApi<unknown>("/api/products/categories", {
    tags: [isrTags.productList()],
    revalidate: PRODUCT_LIST_REVALIDATE,
  });
  return publicEnv.apiMocking
    ? mapProductCategories(productCategoriesDto.parse(dto))
    : mapBackendProductCategories(dto);
}

/**
 * `GET /api/products` — 공개 상품 목록. 서버(RSC/ISR)에서 호출한다.
 * (docs/data-layer.md §2.2 · docs/isr.md §4)
 *
 * 이 슬라이스가 이후 모든 도메인 api 계층의 템플릿이다:
 * validation(Zod) → mapper(DTO→FE 모델) → api(fetch + 태그).
 */
export async function fetchProductList(
  query: ProductListQuery = {},
): Promise<Page<ProductSummary>> {
  assertProductListApiReady();
  const { page, size } = resolveProductListPaging(query);
  const apiQuery =
    !publicEnv.apiMocking && query.category
      ? {
          ...query,
          category: resolveProductCategoryCode(
            query.category,
            await fetchProductCategoriesServer(),
          ),
        }
      : query;
  const search = toProductListSearchParams(apiQuery);

  const dto = await fetchPublicApi<unknown>(`/api/products?${search}`, {
    tags: [isrTags.productList()],
    revalidate: PRODUCT_LIST_REVALIDATE,
  });

  return publicEnv.apiMocking
    ? mapProductListPage(productListResponseDto.parse(dto), { page, size })
    : mapBackendProductList(dto);
}
