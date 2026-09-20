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

/**
 * `GET /api/member/me/reviews/reviewable` 응답 — 목업 전용(대응 BE 엔드포인트 없음).
 * "빠른 후기 작성" 카드용, 리뷰 미작성 + DELIVERED 주문 아이템.
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

/**
 * `GET /api/member/me/reviews` 응답 — 목업 전용(대응 BE 엔드포인트 없음). "내가 작성한
 * 후기" 목록.
 */
export const myReviewDto = z
  .object({
    id: z.number().int(),
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
  .object({
    items: z.array(myReviewDto),
    totalCount: z.number().int().nonnegative(),
  })
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
