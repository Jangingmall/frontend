import { clientFetch } from "@/lib/http/client";
import type { ReviewFilters } from "@/types/review";

import { mapReviewPage } from "./mapper";
import { backendReviewPageDto, reviewPageDto } from "./validation";

/** 시연 확장과 실제 Spring Page 계약을 구분한다. */
export async function fetchReviews(
  productId: number,
  filters: ReviewFilters,
  isMock: boolean,
) {
  if (!isMock) {
    if (filters.photoOnly)
      throw new Error("사진 후기는 아직 지원하지 않습니다.");
    if (!Number.isSafeInteger(filters.page) || filters.page < 1)
      throw new Error("후기 페이지를 확인해 주세요.");
    const sorts = {
      latest: "createdAt,desc",
      high: "rating,desc",
      low: "rating,asc",
    };
    const search = new URLSearchParams({
      page: String(filters.page - 1),
      size: "5",
      sort: sorts[filters.sort],
    });
    search.append("sort", "id,desc");
    const page = backendReviewPageDto.parse(
      await clientFetch(`/api/products/${productId}/reviews?${search}`, {
        auth: false,
      }),
    );
    if (
      page.number !== filters.page - 1 ||
      page.size !== 5 ||
      page.content.some((item) => item.productId !== productId)
    )
      throw new Error("후기 응답을 확인하지 못했습니다.");
    return {
      items: page.content.map((item) => ({
        id: item.reviewId,
        author: "구매자",
        rating: item.rating,
        createdAt: item.createdAt,
        body: item.content,
        optionLabel: "",
        images: [],
      })),
      totalCount: page.totalElements,
      reviewCount: page.totalElements,
      // 한 페이지의 평균을 전체 상품 평점으로 표시하지 않는다.
      rating: null,
    };
  }
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
