import type { OrderStatusGroupKey } from "@/constants/order";

/**
 * 마이페이지 주문 목록(`/mypage/orders`, Figma MY-1) 조회 파라미터.
 * (`장인몰 주문 이력 API 계약서` v1.0, 2026-09-18 BE 확정)
 */
export interface OrdersListQuery {
  /** 1-base. 기본 1. */
  page?: number;
  /** 기본 10 — 화면 자체 페이지네이션 UI 선택값, BE 기본값(20)과 무관하게 항상 명시해 보낸다. */
  size?: number;
  /** ISO 날짜(`YYYY-MM-DD`). 기간 필터 시작. */
  from?: string;
  /** ISO 날짜(`YYYY-MM-DD`). 기간 필터 끝. */
  to?: string;
  /** `ORDER_STATUS_GROUP` 키 중 하나. 없으면 전체. */
  status?: "ALL" | OrderStatusGroupKey;
  /** 장인 이름 부분 일치 검색어. */
  artisanName?: string;
}

export const DEFAULT_ORDERS_LIST_SIZE = 10;

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
 * 화면/URL이 넘긴 `page`·`size`를 계약 범위로 정규화한다. (`api/products/query.ts`와 동일 패턴)
 */
export function resolveOrdersListPaging(query: OrdersListQuery): {
  page: number;
  size: number;
} {
  return {
    page: clampInt(query.page, 1, 1, Number.MAX_SAFE_INTEGER),
    size: clampInt(query.size, DEFAULT_ORDERS_LIST_SIZE, 1, 100),
  };
}

/**
 * FE 필터 탭(`ORDER_STATUS_GROUP`, Figma 8종 기준) → BE `status` 쿼리 파라미터(6종 원본 +
 * `IN_DELIVERY` 가정, 계약서 §3-1). BE는 FE 그룹 키를 모른다 — 이 표가 유일한 변환 지점이다.
 *
 * - `PURCHASE_CONFIRMED`("구매 확정")는 대응하는 BE 상태가 없어 `DELIVERED`로 보낸다 — BE가
 *   구분 필드를 추가하기 전까지는 "배송 완료" 탭과 결과가 같다(design.md §9, 2026-09-18 확인).
 * - `SHIPPING`("배송 중")은 `IN_DELIVERY`로 보낸다 — 계약서 §3-1 허용값 목록엔 없고 §3-3에만
 *   등장해 실제로 필터링되는지 BE 확인 요청함. 확인 전까지 동작한다고 가정.
 * - `EXCHANGE_REFUND`("교환·환불")는 BE의 `RETURN_REQUESTED` 하나가 Figma 7개 세부 상태를
 *   전부 포괄한다(계약서 §4) — 그대로 1:1 대응.
 */
const STATUS_GROUP_TO_RAW: Record<OrderStatusGroupKey, string> = {
  PAYMENT_PENDING: "CREATED",
  PREPARING: "PAID",
  SHIPPING: "IN_DELIVERY",
  DELIVERED: "DELIVERED",
  PURCHASE_CONFIRMED: "DELIVERED",
  EXCHANGE_REFUND: "RETURN_REQUESTED",
  CANCELED: "CANCELED",
};

/** 화면/캐시 쿼리 → 요청 쿼리스트링. `page`는 BE 0-base로 변환한다. */
export function toOrdersListSearchParams(
  query: OrdersListQuery,
): URLSearchParams {
  const { page, size } = resolveOrdersListPaging(query);
  const params = new URLSearchParams();
  params.set("page", String(page - 1));
  params.set("size", String(size));
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.status && query.status !== "ALL") {
    params.set("status", STATUS_GROUP_TO_RAW[query.status]);
  }
  if (query.artisanName) params.set("artisanName", query.artisanName);
  return params;
}
