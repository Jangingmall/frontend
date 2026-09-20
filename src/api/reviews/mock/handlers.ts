import { type DefaultBodyType, http, type PathParams } from "msw";

import { orderDetailFixtures, orderFixtures } from "@/api/orders/mock/fixtures";
import {
  createReviewResponseDto,
  myReviewPageDto,
  reviewableItemDto,
  reviewPageDto,
} from "@/api/reviews/validation";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import { createReviewFixtures, MY_REVIEW_FIXTURES } from "./fixtures";

/**
 * 후기 작성 성공 시 해당 주문 아이템의 `reviewId`를 채워 넣는다 — `orderFixtures`(목록)와
 * `orderDetailFixtures`(상세)는 서로 다른 객체 복사본이라(스프레드로 생성) 둘 다 각각
 * 찾아서 mutate해야 한다. 기존 취소·교환환불 핸들러(`api/orders/mock/handlers.ts`)가
 * `orderFixtures.find(...)`로 두 곳을 각각 갱신하는 것과 같은 패턴.
 */
function markOrderItemReviewed(orderItemId: number, reviewId: number): void {
  for (const order of orderFixtures) {
    const item = order.items.find((i) => i.orderItemId === orderItemId);
    if (item) item.reviewId = reviewId;
  }
  for (const detail of orderDetailFixtures.values()) {
    const item = detail.items.find((i) => i.orderItemId === orderItemId);
    if (item) item.reviewId = reviewId;
  }
}

let nextMyReviewId = 1000;

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

  /**
   * `GET /api/member/me/reviews/reviewable` — 목업 전용(대응 BE 엔드포인트 없음). 매번
   * `orderDetailFixtures`에서 실시간으로 계산한다(정적 배열로 미리 만들어두면 후기 작성
   * 직후에도 계속 보이는 stale 문제가 생긴다) — DELIVERED 상태(구매확정 여부 무관, §BE
   * 목록 응답엔 이 구분이 없다)면서 아직 `reviewId`가 없는 아이템만 뽑는다.
   */
  http.get("*/api/member/me/reviews/reviewable", () => {
    const items = [...orderDetailFixtures.values()]
      .filter((detail) => detail.status === "DELIVERED")
      .flatMap((detail) =>
        detail.items
          .filter((item) => item.reviewId == null)
          .map((item) => ({
            orderItemId: item.orderItemId,
            productId: item.productId,
            productName: item.productName,
            thumbnailUrl: item.thumbnail[0]?.url ?? null,
            options: item.options,
            purchasedAt: detail.createdAt,
            rewardPoints: 100,
          })),
      );
    return mockOk(reviewableItemDto.array().parse(items));
  }),

  /** `GET /api/member/me/reviews` — 목업 전용(대응 BE 엔드포인트 없음). */
  http.get("*/api/member/me/reviews", ({ request }) => {
    const search = new URL(request.url).searchParams;
    const page = Math.max(1, Number(search.get("page")) || 1);
    const size = Math.max(1, Number(search.get("size")) || 5);
    const sorted = [...MY_REVIEW_FIXTURES].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return mockOk(
      myReviewPageDto.parse({
        items: sorted.slice((page - 1) * size, page * size),
        totalCount: sorted.length,
      }),
    );
  }),

  /**
   * `POST /api/products/{productId}/reviews` — 실제 BE 경로·계약 그대로(`ProductController`/
   * `ProductReviewService`). 주문 아이템당 후기 1개만 허용(유니크 제약)한다 — 이미 작성한
   * 아이템이면 실제 BE와 같은 방식(`BUSINESS_RULE_VIOLATION`)으로 거부한다.
   */
  http.post<
    PathParams,
    DefaultBodyType,
    ApiErrorResponse | ApiResponse<unknown>
  >("*/api/products/:productId/reviews", async ({ params, request }) => {
    const productId = Number(params.productId);
    const body = (await request.json()) as {
      orderItemId: number;
      rating: number;
      content: string;
      images?: string[];
    };
    const alreadyReviewed = orderFixtures.some((order) =>
      order.items.some(
        (item) =>
          item.orderItemId === body.orderItemId && item.reviewId != null,
      ),
    );
    if (alreadyReviewed) {
      return mockError(
        422,
        "BUSINESS_RULE_VIOLATION",
        "이미 후기를 작성했습니다.",
      );
    }
    const reviewId = nextMyReviewId++;
    const productName =
      orderFixtures
        .flatMap((order) => order.items)
        .find((item) => item.orderItemId === body.orderItemId)?.productName ??
      "상품명";
    const thumbnailUrl =
      orderFixtures
        .flatMap((order) => order.items)
        .find((item) => item.orderItemId === body.orderItemId)?.thumbnail[0]
        ?.url ?? null;
    const createdAt = new Date().toISOString();
    MY_REVIEW_FIXTURES.unshift({
      id: reviewId,
      orderItemId: body.orderItemId,
      productId,
      productName,
      thumbnailUrl,
      rating: body.rating,
      content: body.content,
      images: (body.images ?? []).map((src) => ({ src, alt: "" })),
      createdAt,
    });
    markOrderItemReviewed(body.orderItemId, reviewId);
    return mockOk(
      createReviewResponseDto.parse({
        reviewId,
        productId,
        writerId: 1,
        orderItemId: body.orderItemId,
        rating: body.rating,
        content: body.content,
        images: body.images ?? [],
        createdAt,
      }),
      201,
    );
  }),
];
