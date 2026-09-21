"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchWishedIds, fetchWishlist } from "@/api/wishlist/api";

import { wishlistKeys } from "./keys";

/** 마이페이지 찜 목록(`/mypage/wishlist`) — 페이지 전환 중 이전 데이터 유지. */
export function useWishlistQuery(page: number) {
  return useQuery({
    queryKey: wishlistKeys.list(page),
    queryFn: () => fetchWishlist(page),
    placeholderData: keepPreviousData,
  });
}

/**
 * 최근 본 상품 화면(`/mypage/recent`)의 카드별 하트 상태용 — 찜한 상품 id 전체를 한 번에
 * 받아 각 카드가 `wishedIds.has(id)`로 자기 상태를 판단한다.
 */
export function useWishedIdsQuery(enabled: boolean) {
  return useQuery({
    queryKey: wishlistKeys.wishedIds(),
    queryFn: fetchWishedIds,
    enabled,
    staleTime: 30000,
  });
}
