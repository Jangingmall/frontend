import { type ProductListSort, toProductListSortApi } from "@/types/sort";

/**
 * 상품 목록 조회 파라미터. 화면/URL이 넘기는 부분집합이며 필터 축은 이후 작업에서 확장한다.
 * (docs/api-contract.md §5 목록 필터, docs/routing-and-auth.md §3)
 */
export interface ProductListQuery {
  /** 1-base. 기본 1. */
  page?: number;
  /** 기본 20, 최대 100. (docs/api-contract.md §2.4) */
  size?: number;
  /** 기본 `popular`. */
  sort?: ProductListSort;
  keyword?: string;
  category?: string;
}

export const DEFAULT_PRODUCT_LIST_SIZE = 20;

/**
 * 목록 파라미터 → BE 쿼리스트링. BE 페이지네이션 파라미터명(`page`+`size` vs
 * `offset`+`limit`)이 확정되면 이 함수만 고친다.
 */
export function toProductListSearchParams(
  query: ProductListQuery,
): URLSearchParams {
  const page = query.page ?? 1;
  const size = query.size ?? DEFAULT_PRODUCT_LIST_SIZE;
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sort", toProductListSortApi(query.sort));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.category) params.set("category", query.category);
  return params;
}
