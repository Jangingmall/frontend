import { clientFetch } from "@/lib/http/client";
import type { ReviewFilters } from "@/types/review";

import { mapReviewPage } from "./mapper";
import { reviewPageDto } from "./validation";
export async function fetchDemoReviews(id: number, filters: ReviewFilters) {
  const search = new URLSearchParams({
    page: String(filters.page),
    sort: filters.sort,
    photoOnly: String(filters.photoOnly),
  });
  return mapReviewPage(
    reviewPageDto.parse(
      await clientFetch(`/api/mock/products/${id}/reviews?${search}`, {
        auth: false,
      }),
    ),
  );
}
