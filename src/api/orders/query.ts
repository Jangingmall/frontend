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

/** 화면 필터를 BE 주문 상태로 변환한다. 구매 확정은 독립 상태로 조회한다. */
const STATUS_GROUP_TO_RAW: Record<OrderStatusGroupKey, string> = {
  PAYMENT_PENDING: "CREATED",
  PREPARING: "PAID",
  SHIPPING: "IN_DELIVERY",
  DELIVERED: "DELIVERED",
  PURCHASE_CONFIRMED: "PURCHASE_CONFIRMED",
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
