"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchOrdersList, fetchOrderStatusSummary } from "@/api/orders/api";
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

/** "내 주문 현황" 요약 — 필터와 무관한 고정 조회(design.md §5.2). */
export function useOrderStatusSummaryQuery() {
  return useQuery({
    queryKey: orderKeys.statusSummary,
    queryFn: fetchOrderStatusSummary,
  });
}
