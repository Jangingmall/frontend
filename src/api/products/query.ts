import { publicEnv } from "@/lib/env";
import { type GiftThemeId, toGiftThemeApi } from "@/types/gift-theme";
import { type ProductListSort, toProductListSortApi } from "@/types/sort";

/**
 * 상품 목록 조회 파라미터. PL-2·PL-3·홈 선물 섹션의 공개 필터를 담는다.
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
  /** 종목 필터. BE의 PD 분류·복수 값 계약 확인 전까지 MSW에서만 사용한다. (#48) */
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
 * 목록 파라미터 → 요청 쿼리스트링. 현재 `page`+`size`는 FE/MSW 잠정 계약이다.
 * TODO #48: Notion 명세는 `cursor`/`limit` 요청과 `page`/`totalPages` 응답을 함께
 * 기재하지만 `page` 요청이 빠져 있다. BE 번호 페이지 지원 확인 후 여기서 변환한다.
 * GNB URL의 PD 분류와 BE 코드 매핑도 이 API 경계에서 맞추고 GNB 계약은 유지한다.
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
  // TODO #48: PD 분류, 종목/소재 복수 값, 목록 DTO·페이지 계약을 함께 검증한 뒤
  // UI·URL·조회 제한을 해제한다. 반복 subcategory의 OR는 현재 MSW에서만 검증했다.
  if (publicEnv.apiMocking) {
    for (const craft of [...new Set(query.crafts)].filter(Boolean).sort()) {
      params.append("subcategory", craft);
    }
  }
  // TODO #48: material 복수 값 형식과 OR 조건도 BE 확인 대상이다. 기존 직렬화를
  // 유지하며, MSW 조합 필터 통과를 운영 API 연동 완료로 판단하지 않는다.
  for (const material of [...new Set(query.materials)].filter(Boolean).sort()) {
    params.append("material", material);
  }
  for (const key of ["minPrice", "maxPrice"] as const) {
    const value = query[key];
    if (value !== undefined && Number.isSafeInteger(value) && value >= 0) {
      params.set(key, String(value));
    }
  }
  if (query.giftTheme) params.set("giftTheme", toGiftThemeApi(query.giftTheme));
  if (query.hasGiftWrap) params.set("hasGiftWrap", "true");
  // BE 기본값이 true이므로 체크 해제 상태도 명시적으로 보낸다.
  params.set("excludeSoldOut", String(query.excludeSoldOut ?? false));
  return params;
}
