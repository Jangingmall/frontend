import type {
  MyReview,
  MyReviewPage,
  ReviewableItem,
  ReviewPage,
} from "@/types/review";

import type {
  MyReviewPageDto,
  ReviewableItemDto,
  ReviewPageDto,
} from "./validation";

export function mapReviewPage(dto: ReviewPageDto): ReviewPage {
  return {
    items: dto.items.map(
      ({ id, author, rating, createdAt, body, optionLabel, images }) => ({
        id,
        author,
        rating,
        createdAt,
        body,
        optionLabel,
        images: images.map(({ src, alt }) => ({ src, alt })),
      }),
    ),
    totalCount: dto.totalCount,
    reviewCount: dto.reviewCount,
    rating: dto.rating,
  };
}

export function mapReviewableItem(dto: ReviewableItemDto): ReviewableItem {
  return {
    orderItemId: dto.orderItemId,
    productId: dto.productId,
    productName: dto.productName,
    thumbnailUrl: dto.thumbnailUrl,
    options: dto.options ?? [],
    purchasedAt: dto.purchasedAt ?? null,
    rewardPoints: dto.rewardPoints ?? null,
  };
}

function mapMyReview(dto: MyReviewPageDto["content"][number]): MyReview {
  return {
    id: dto.reviewId,
    orderItemId: dto.orderItemId ?? null,
    productId: dto.productId,
    productName: dto.productName ?? null,
    thumbnailUrl: dto.thumbnailUrl ?? null,
    rating: dto.rating,
    content: dto.content,
    images: dto.images.map(({ src, alt }) => ({ src, alt })),
    createdAt: dto.createdAt,
  };
}

export function mapMyReviewPage(dto: MyReviewPageDto): MyReviewPage {
  return {
    items: dto.content.map(mapMyReview),
    totalCount: dto.totalElements,
  };
}
