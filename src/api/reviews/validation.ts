import { z } from "zod";

export const reviewDto = z
  .object({
    id: z.number().int(),
    author: z.string(),
    rating: z.number().min(0).max(5),
    createdAt: z.string(),
    body: z.string(),
    optionLabel: z.string(),
    images: z.array(
      z.object({ src: z.string(), alt: z.string() }).passthrough(),
    ),
  })
  .passthrough();
export const reviewPageDto = z
  .object({
    items: z.array(reviewDto),
    totalCount: z.number().int().nonnegative(),
    reviewCount: z.number().int().nonnegative(),
    rating: z.number().min(0).max(5).nullable(),
  })
  .passthrough();
export type ReviewPageDto = z.infer<typeof reviewPageDto>;

/** 현재 BE ProductReviewResponse.ReviewView + Spring Page. */
export const backendReviewPageDto = z.object({
  content: z.array(
    z.object({
      reviewId: z.number().int().positive().safe(),
      productId: z.number().int().positive().safe(),
      writerId: z.number().int().positive().safe(),
      rating: z.number().int().min(1).max(5),
      content: z.string(),
      createdAt: z.string(),
    }),
  ),
  number: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
});

/** Spring `Page` 직렬화 그대로 — `orderListResponseDto`와 같은 패턴. */
const springPageEnvelope = {
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  number: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
};

/**
 * `GET /api/member/me/reviews/writable` 응답 — 실제 BE 엔드포인트가 있다
 * (`MemberQueryController#writable`, 2026-09-21 BE 레포 직접 대조로 확인). 다만 응답에
 * `options`·`purchasedAt`·`rewardPoints`는 아직 없다 — `options`는 `order_item` 테이블
 * 자체에 컬럼이 없어서(be-requests.md #8과 같은 원인), `purchasedAt`은 이미 조인된
 * `MemberOrderView.createdAt`을 안 내려주고 있어서(be-requests.md #11), `rewardPoints`는
 * 적립금 도메인 자체가 BE에 없어서다. mock은 화면이 최종적으로 그려야 할 모양(Figma)대로
 * 세 필드를 채워 보여준다 — "빠른 후기 작성" 카드용, 리뷰 미작성 + DELIVERED 주문 아이템.
 */
export const reviewableItemDto = z
  .object({
    orderItemId: z.number().int(),
    productId: z.number().int(),
    productName: z.string(),
    thumbnailUrl: z.string().nullable(),
    options: z.array(z.string()),
    purchasedAt: z.string(),
    rewardPoints: z.number().int(),
  })
  .passthrough();
export type ReviewableItemDto = z.infer<typeof reviewableItemDto>;
export const reviewableItemsPageDto = z
  .object({ content: z.array(reviewableItemDto), ...springPageEnvelope })
  .passthrough();

/**
 * `GET /api/member/me/reviews` 응답 — 실제 BE 엔드포인트가 있다
 * (`MemberQueryController#reviews`, 2026-09-21 BE 레포 직접 대조로 확인). "내가 작성한
 * 후기" 목록. 다만 지금은 `ProductReview`·`Member`만 조인해 `orderItemId`(엔티티엔 이미
 * 있는 컬럼)·`productName`·`thumbnailUrl`(둘 다 `Product` 미조인)을 안 내려주고, `images`도
 * 실제 저장값 대신 빈 배열을 하드코딩해 내려준다(be-requests.md #11). mock은 화면이
 * 최종적으로 그려야 할 모양대로 채워 보여준다.
 */
export const myReviewDto = z
  .object({
    reviewId: z.number().int(),
    orderItemId: z.number().int(),
    productId: z.number().int(),
    productName: z.string(),
    thumbnailUrl: z.string().nullable(),
    rating: z.number().min(0.5).max(5),
    content: z.string(),
    images: z.array(
      z.object({ src: z.string(), alt: z.string() }).passthrough(),
    ),
    createdAt: z.string(),
  })
  .passthrough();
export const myReviewPageDto = z
  .object({ content: z.array(myReviewDto), ...springPageEnvelope })
  .passthrough();
export type MyReviewDto = z.infer<typeof myReviewDto>;
export type MyReviewPageDto = z.infer<typeof myReviewPageDto>;

/**
 * `POST /api/products/{productId}/reviews` 응답 — 실제 BE 계약 그대로
 * (`ProductReviewResponse.ReviewView`).
 */
export const createReviewResponseDto = z
  .object({
    reviewId: z.number().int(),
    productId: z.number().int(),
    writerId: z.number().int(),
    orderItemId: z.number().int(),
    rating: z.number(),
    content: z.string(),
    images: z.array(z.string()).optional(),
    createdAt: z.string(),
  })
  .passthrough();
export type CreateReviewResponseDto = z.infer<typeof createReviewResponseDto>;
