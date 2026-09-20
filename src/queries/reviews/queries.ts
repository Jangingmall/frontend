import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchMyReviews,
  fetchReviewableItems,
  fetchReviews,
} from "@/api/reviews/api";
import { startMockWorker } from "@/mocks/start-browser";
import type { ReviewFilters } from "@/types/review";

import { reviewKeys } from "./keys";

export function useProductReviews(
  id: number,
  filters: ReviewFilters,
  isMock: boolean,
) {
  return useQuery({
    queryKey: reviewKeys.list(id, filters, isMock),
    queryFn: async () => {
      await startMockWorker();
      return fetchReviews(id, filters, isMock);
    },
    placeholderData: keepPreviousData,
  });
}

/** 마이페이지 "내가 쓴 후기" — 빠른 후기 작성 카드 목록. */
export function useReviewableItemsQuery() {
  return useQuery({
    queryKey: reviewKeys.reviewable(),
    queryFn: fetchReviewableItems,
  });
}

/** 마이페이지 "내가 쓴 후기" — 내가 작성한 후기 목록. 페이지 전환 중 이전 데이터를 유지한다. */
export function useMyReviewsQuery(page: number) {
  return useQuery({
    queryKey: reviewKeys.myReviews(page),
    queryFn: () => fetchMyReviews(page),
    placeholderData: keepPreviousData,
  });
}
