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
  materials?: string[];
  minPrice?: number;
  maxPrice?: number;
  hasGiftWrap?: boolean;
  excludeSoldOut?: boolean;
}

export const DEFAULT_PRODUCT_LIST_SIZE = 20;
export const MAX_PRODUCT_LIST_SIZE = 100;

function clampInt(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/**
 * 화면/URL이 넘긴 `page`·`size`를 계약 범위로 정규화한다. (docs/api-contract.md §2.4)
 * `0`·음수·소수·`NaN`·`Infinity`·상한 초과 입력이 서버 요청과 `Page` 모델에 그대로
 * 실리지 않게 막는다. 쿼리스트링·fetch·페이지 모델이 같은 값을 공유하도록 한 곳에서 계산.
 */
export function resolveProductListPaging(query: ProductListQuery): {
  page: number;
  size: number;
} {
  return {
    page: clampInt(query.page, 1, 1, Number.MAX_SAFE_INTEGER),
    size: clampInt(
      query.size,
      DEFAULT_PRODUCT_LIST_SIZE,
      1,
      MAX_PRODUCT_LIST_SIZE,
    ),
  };
}

/**
 * 목록 파라미터 → BE 쿼리스트링. BE 페이지네이션 파라미터명(`page`+`size` vs
 * `offset`+`limit`)이 확정되면 이 함수만 고친다.
 */
export function toProductListSearchParams(
  query: ProductListQuery,
): URLSearchParams {
  const { page, size } = resolveProductListPaging(query);
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  params.set("sort", toProductListSortApi(query.sort));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.category) params.set("category", query.category);
  for (const material of [...new Set(query.materials)].filter(Boolean).sort()) {
    params.append("material", material);
  }
  for (const key of ["minPrice", "maxPrice"] as const) {
    const value = query[key];
    if (value !== undefined && Number.isSafeInteger(value) && value >= 0) {
      params.set(key, String(value));
    }
  }
  if (query.hasGiftWrap) params.set("hasGiftWrap", "true");
  // BE 기본값이 true이므로 체크 해제 상태도 명시적으로 보낸다.
  params.set("excludeSoldOut", String(query.excludeSoldOut ?? false));
  return params;
}
