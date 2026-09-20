import type { ReviewFilters } from "@/types/review";

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (id: number, filters: ReviewFilters, isMock: boolean) =>
    ["reviews", id, filters, isMock] as const,
  /** "빠른 후기 작성" 카드 목록 — 마이페이지 후기 화면 전용. */
  reviewable: () => [...reviewKeys.all, "reviewable"] as const,
  /** "내가 작성한 후기" 목록 — 마이페이지 후기 화면 전용. */
  myReviews: (page: number) => [...reviewKeys.all, "myReviews", page] as const,
};
