import { fetchPublicApi } from "@/lib/http/fetcher";
import type { Page } from "@/types/api";

import { mapProductListPage } from "./mapper";
import type { ProductSummary } from "./model";
import {
  DEFAULT_PRODUCT_LIST_SIZE,
  type ProductListQuery,
  toProductListSearchParams,
} from "./query";
import { productListResponseDto } from "./validation";

/**
 * ISR 컬렉션 태그. 필터·정렬·page 조합을 모두 포괄한다. (docs/isr.md §2·§3)
 * 태그 문자열 팩토리가 정리되면 그쪽으로 옮긴다.
 */
const PRODUCT_LIST_TAG = "products";

/** 웹훅 유실 대비 안전망(1시간). 이벤트 기반 재검증이 우선이다. (docs/isr.md §2) */
const PRODUCT_LIST_REVALIDATE = 3600;

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
  const page = query.page ?? 1;
  const size = query.size ?? DEFAULT_PRODUCT_LIST_SIZE;
  const search = toProductListSearchParams({ ...query, page, size });

  const dto = await fetchPublicApi<unknown>(`/api/products?${search}`, {
    tags: [PRODUCT_LIST_TAG],
    revalidate: PRODUCT_LIST_REVALIDATE,
  });

  return mapProductListPage(productListResponseDto.parse(dto), { page, size });
}
