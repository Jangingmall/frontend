import { clientFetch } from "@/lib/http/client";
import type {
  MyReviewPage,
  ReviewableItem,
  ReviewFilters,
} from "@/types/review";

import { mapMyReviewPage, mapReviewableItem, mapReviewPage } from "./mapper";
import {
  backendReviewPageDto,
  createReviewResponseDto,
  myReviewPageDto,
  reviewableItemDto,
  reviewPageDto,
} from "./validation";

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

/** "빠른 후기 작성" 카드 목록 — 목업 전용(대응 BE 엔드포인트 없음). */
export async function fetchReviewableItems(): Promise<ReviewableItem[]> {
  const data = await clientFetch<unknown>("/api/member/me/reviews/reviewable");
  return reviewableItemDto.array().parse(data).map(mapReviewableItem);
}

/** "내가 작성한 후기" 목록 — 목업 전용(대응 BE 엔드포인트 없음). */
export async function fetchMyReviews(page: number): Promise<MyReviewPage> {
  const search = new URLSearchParams({ page: String(page), size: "5" });
  const data = await clientFetch<unknown>(`/api/member/me/reviews?${search}`);
  return mapMyReviewPage(myReviewPageDto.parse(data));
}

/**
 * 후기 작성 — 실제 BE 계약 그대로(`POST /api/products/{productId}/reviews`). `rating`은
 * FE가 0.5 단위로 받은 값을 그대로 보낸다 — BE는 현재 정수만 받으므로 mock-off 시
 * 서버가 정수로 반올림·절사하거나 거부할 수 있다(BE에 0.5 단위 지원 요청함, be-requests.md
 * #10).
 */
export async function createReview(
  productId: number,
  input: {
    orderItemId: number;
    rating: number;
    content: string;
    images: string[];
  },
): Promise<void> {
  const data = await clientFetch<unknown>(
    `/api/products/${productId}/reviews`,
    { method: "POST", body: input },
  );
  createReviewResponseDto.parse(data);
}
