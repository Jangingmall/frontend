"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchRecentViews } from "@/api/recent-views/api";

import { recentViewKeys } from "./keys";

/** 마이페이지 최근 본 상품(`/mypage/recent`) — 페이지 전환 중 이전 데이터 유지. */
export function useRecentViewsQuery(page: number) {
  return useQuery({
    queryKey: recentViewKeys.list(page),
    queryFn: () => fetchRecentViews(page),
    placeholderData: keepPreviousData,
  });
}
