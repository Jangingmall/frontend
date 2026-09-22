import { publicEnv } from "@/lib/env";
import { type GiftThemeId, toGiftThemeApi } from "@/types/gift-theme";
import { type ProductListSort, toProductListSortApi } from "@/types/sort";

import { canUseProductCrafts, canUseProductMaterials } from "./integration";

/**
 * 상품 목록 조회 파라미터. PL-2·PL-3·홈 선물 섹션의 공개 필터를 담는다.
 * (docs/api-contract.md §5 목록 필터, docs/routing-and-auth.md §3)
 */
export interface ProductListQuery {
  /** 1-base. 기본 1. */
  page?: number;
  /** 기본 20, 최대 100. (docs/api-contract.md §2.4) */
  size?: number;
  /** mock 기본 popular, 실제 API 기본 newest. */
  sort?: ProductListSort;
  keyword?: string;
  category?: string;
  /** 공예 종목. 현재 MSW에서만 사용하며 목록 API 활성화와 별도로 지원 여부를 확인한다. */
  crafts?: string[];
  materials?: string[];
  minPrice?: number;
  maxPrice?: number;
  hasGiftWrap?: boolean;
  excludeSoldOut?: boolean;
  /** 홈 선물 섹션 테마 필터. API 코드값은 아직 placeholder(`types/gift-theme.ts`). */
  giftTheme?: GiftThemeId;
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
 * 화면/캐시 쿼리 → 요청 파라미터. 실제 BE의 Spring Pageable만 0-based로 변환한다.
 * 실제 요청에는 Pageable만 전송한다. FE 필터는 backend-list에서 전체 조회 후 적용한다.
 */
export function toProductListSearchParams(
  query: ProductListQuery,
): URLSearchParams {
  const { page, size } = resolveProductListPaging(query);
  const params = new URLSearchParams();
  params.set("page", String(publicEnv.apiMocking ? page : page - 1));
  params.set("size", String(size));
  if (!publicEnv.apiMocking) {
    params.set(
      "sort",
      query.sort === "price-asc"
        ? "PRICE_ASC"
        : query.sort === "price-desc"
          ? "PRICE_DESC"
          : "NEWEST",
    );
    if (query.keyword?.trim()) params.set("keyword", query.keyword.trim());
    for (const key of ["minPrice", "maxPrice"] as const) {
      const value = query[key];
      if (value !== undefined && Number.isSafeInteger(value) && value >= 0)
        params.set(key, String(value));
    }
    if (query.giftTheme)
      params.set("giftTheme", toGiftThemeApi(query.giftTheme));
    params.set("excludeSoldOut", String(query.excludeSoldOut ?? false));
    return params;
  }
  params.set("sort", toProductListSortApi(query.sort));
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.category) params.set("category", query.category);
  if (canUseProductCrafts()) {
    for (const craft of [...new Set(query.crafts)].filter(Boolean).sort()) {
      params.append("subcategory", craft);
    }
  }
  if (canUseProductMaterials()) {
    for (const material of [...new Set(query.materials)]
      .filter(Boolean)
      .sort()) {
      params.append("material", material);
    }
  }
  for (const key of ["minPrice", "maxPrice"] as const) {
    const value = query[key];
    if (value !== undefined && Number.isSafeInteger(value) && value >= 0) {
      params.set(key, String(value));
    }
  }
  if (query.giftTheme) params.set("giftTheme", toGiftThemeApi(query.giftTheme));
  if (query.hasGiftWrap) params.set("hasGiftWrap", "true");
  // 데모 API에서는 체크 해제 상태도 명시한다. 실제 BE는 ON_SALE만 반환한다.
  params.set("excludeSoldOut", String(query.excludeSoldOut ?? false));
  return params;
}
