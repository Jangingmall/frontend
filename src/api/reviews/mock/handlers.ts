import { type DefaultBodyType, http, type PathParams } from "msw";

import { imageUrl } from "@/api/images/read-model";
import { orderDetailFixtures, orderFixtures } from "@/api/orders/mock/fixtures";
import {
  createReviewResponseDto,
  myReviewPageDto,
  reviewableItemsPageDto,
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
   * `GET /api/member/me/reviews/writable` — 실제 BE 엔드포인트가 있다(`validation.ts`
   * 주석 참고). 매번 `orderDetailFixtures`에서 실시간으로 계산한다(정적 배열로 미리
   * 만들어두면 후기 작성 직후에도 계속 보이는 stale 문제가 생긴다) — 배송 완료 또는
   * 구매 확정 상태면서 아직 `reviewId`가 없는
   * 아이템만 뽑는다. BE가 아직 안 주는 `options`·`purchasedAt`·`rewardPoints`는 mock이
   * 목표 계약대로 채운다.
   */
  http.get("*/api/member/me/reviews/writable", ({ request }) => {
    const search = new URL(request.url).searchParams;
    // BE 0-base — 목업도 그대로 0-base로 다룬다(`api/orders/mock/handlers.ts`와 동일 패턴).
    const page = Math.max(0, Number(search.get("page")) || 0);
    const size = Math.min(100, Math.max(1, Number(search.get("size")) || 20));
    const all = [...orderDetailFixtures.values()]
      .filter((detail) =>
        ["DELIVERED", "PURCHASE_CONFIRMED"].includes(detail.status),
      )
      .flatMap((detail) =>
        detail.items
          .filter((item) => item.reviewId == null)
          .map((item) => ({
            orderItemId: item.orderItemId,
            productId: item.productId,
            productName: item.productName,
            thumbnailUrl: imageUrl(item.thumbnail, item.legacyThumbnailUrl),
            options: item.options,
            purchasedAt: detail.createdAt,
            rewardPoints: 100,
          })),
      );
    const offset = page * size;
    const content = all.slice(offset, offset + size);
    const totalPages = Math.ceil(all.length / size);
    return mockOk(
      reviewableItemsPageDto.parse({
        content,
        totalElements: all.length,
        totalPages,
        size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1,
        empty: content.length === 0,
      }),
    );
  }),

  /** `GET /api/member/me/reviews` — 실제 BE 엔드포인트가 있다(`validation.ts` 주석 참고). */
  http.get("*/api/member/me/reviews", ({ request }) => {
    const search = new URL(request.url).searchParams;
    const page = Math.max(0, Number(search.get("page")) || 0);
    const size = Math.min(100, Math.max(1, Number(search.get("size")) || 20));
    const sorted = [...MY_REVIEW_FIXTURES]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ id, ...rest }) => ({ reviewId: id, ...rest }));
    const offset = page * size;
    const content = sorted.slice(offset, offset + size);
    const totalPages = Math.ceil(sorted.length / size);
    return mockOk(
      myReviewPageDto.parse({
        content,
        totalElements: sorted.length,
        totalPages,
        size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1,
        empty: content.length === 0,
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
    const orderItem = orderFixtures
      .flatMap((order) => order.items)
      .find((item) => item.orderItemId === body.orderItemId);
    const thumbnailUrl = imageUrl(
      orderItem?.thumbnail,
      orderItem?.legacyThumbnailUrl,
    );
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
