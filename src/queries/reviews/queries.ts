import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchReviews } from "@/api/reviews/api";
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
