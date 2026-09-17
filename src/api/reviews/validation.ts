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
