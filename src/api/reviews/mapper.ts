import type { ReviewPage } from "@/types/review";

import type { ReviewPageDto } from "./validation";

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
