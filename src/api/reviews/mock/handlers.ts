import { type DefaultBodyType, http, type PathParams } from "msw";

import { reviewPageDto } from "@/api/reviews/validation";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import { createReviewFixtures } from "./fixtures";

export const reviewHandlers = [
  http.get<
    PathParams,
    DefaultBodyType,
    ApiErrorResponse | ApiResponse<unknown>
  >("*/api/mock/products/:productId/reviews", ({ params, request }) => {
    const productId = Number(params.productId);
    if (productId === 997) return mockError(503, "INTERNAL_ERROR");
    const search = new URL(request.url).searchParams;
    const all = createReviewFixtures(productId);
    const filtered = all.filter(
      (review) =>
        search.get("photoOnly") !== "true" || review.images.length > 0,
    );
    const sort = search.get("sort");
    filtered.sort((a, b) =>
      sort === "high"
        ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
        : sort === "low"
          ? a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)
          : b.createdAt.localeCompare(a.createdAt),
    );
    const page = Math.max(1, Number(search.get("page")) || 1);
    return mockOk(
      reviewPageDto.parse({
        items: filtered.slice((page - 1) * 5, page * 5),
        totalCount: filtered.length,
        reviewCount: all.length,
        rating: all.length
          ? Math.round(
              (all.reduce((sum, review) => sum + review.rating, 0) /
                all.length) *
                10,
            ) / 10
          : null,
      }),
    );
  }),
];
