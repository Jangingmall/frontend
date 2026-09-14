import { clientFetch } from "@/lib/http/client";
import type { ReviewFilters } from "@/types/review";

import { mapReviewPage } from "./mapper";
import { reviewPageDto } from "./validation";

/** BE 계약 확정 전까지 명시적 mock 경로에서만 제공한다. */
export async function fetchReviews(
  productId: number,
  filters: ReviewFilters,
  isMock: boolean,
) {
  if (!isMock) throw new Error("후기 조회를 준비 중입니다.");
  const search = new URLSearchParams({
    page: String(filters.page),
    sort: filters.sort,
    photoOnly: String(filters.photoOnly),
  });
  const data = await clientFetch<unknown>(
    `/api/mock/products/${productId}/reviews?${search}`,
    { auth: false },
  );
  return mapReviewPage(reviewPageDto.parse(data));
}
