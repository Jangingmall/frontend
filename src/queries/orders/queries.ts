"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchCancellationOrdersList,
  fetchOrderDelivery,
  fetchOrderDetail,
  fetchOrdersList,
  fetchOrderStatusSummary,
} from "@/api/orders/api";
import type { OrdersListQuery } from "@/api/orders/query";

import { orderKeys } from "./keys";

/** 마이페이지 주문 목록. 필터·페이지 전환 시 이전 데이터를 유지한다(design.md §6.4). */
export function useOrdersListQuery(query: OrdersListQuery) {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: () => fetchOrdersList(query),
    placeholderData: keepPreviousData,
  });
}

/**
 * 취소·교환·환불 내역(MY-2) 전용 주문 목록 — "전체" 탭일 때만 두 상태를 병합 조회하고
 * (`fetchCancellationOrdersList`), 나머지 탭은 일반 목록 조회와 동일하게 동작한다.
 */
export function useCancellationOrdersListQuery(query: OrdersListQuery) {
  return useQuery({
    queryKey: orderKeys.cancellationList(query),
    queryFn: () => fetchCancellationOrdersList(query),
    placeholderData: keepPreviousData,
  });
}

/** "내 주문 현황" 요약 — 필터와 무관한 고정 조회(design.md §5.2). */
export function useOrderStatusSummaryQuery() {
  return useQuery({
    queryKey: orderKeys.statusSummary,
    queryFn: fetchOrderStatusSummary,
  });
}

/** 주문 상세(`/mypage/orders/[orderId]`). 본인 주문이 아니거나 없으면 404(T-28 design.md §5). */
export function useOrderDetailQuery(orderId: number) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => fetchOrderDetail(orderId),
  });
}

/**
 * 배송 조회 모달(OD-2) 전용 — 모달이 열렸을 때만 호출한다(`enabled`). 매번 새로 조회해
 * 최신 배송 상태를 보여준다(T-28 design.md §4.4).
 */
export function useOrderDeliveryQuery(orderId: number, enabled: boolean) {
  return useQuery({
    queryKey: orderKeys.delivery(orderId),
    queryFn: () => fetchOrderDelivery(orderId),
    enabled,
  });
}
