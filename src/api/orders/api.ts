import { clientFetch } from "@/lib/http/client";
import type { Page } from "@/types/api";
import type { OrderGroup, OrderStatusSummary } from "@/types/order";

import { mapOrderListPage, mapOrderStatusSummary } from "./mapper";
import { type OrdersListQuery, toOrdersListSearchParams } from "./query";
import { orderListResponseDto, orderStatusSummaryDto } from "./validation";

/**
 * 마이페이지 주문 목록 도메인 API 함수. (`장인몰 주문 이력 API 계약서` v1.0 확정 —
 * 인증 데이터라 ISR 제외 · `clientFetch`로 Bearer 주입)
 */

/** `GET /api/member/me/orders` → 페이지네이션된 주문 목록. */
export async function fetchOrdersList(
  query: OrdersListQuery = {},
): Promise<Page<OrderGroup>> {
  const data = await clientFetch<unknown>(
    `/api/member/me/orders?${toOrdersListSearchParams(query)}`,
  );
  return mapOrderListPage(orderListResponseDto.parse(data));
}

/** `GET /api/member/me/orders/summary` → 최근 3개월 고정 기준 상태별 카운트. */
export async function fetchOrderStatusSummary(): Promise<OrderStatusSummary> {
  const data = await clientFetch<unknown>("/api/member/me/orders/summary");
  return mapOrderStatusSummary(orderStatusSummaryDto.parse(data));
}
