import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import type { RecentViewPageDto } from "./validation";

/** `viewedAt`은 v1 화면에 표시하지 않는다(Figma MY-5 카드 확인 — 날짜 텍스트 없음). */
export function mapRecentViewPage(
  dto: RecentViewPageDto,
): Page<ProductSummary> {
  return {
    items: dto.content.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      thumbnail: null,
      thumbnailUrl: item.thumbnail[0]?.url ?? null,
      artisan: { id: item.artisanId, name: item.artisanName },
      craftCategory: null,
      rating: item.rating,
      reviewCount: null,
      primaryBadge: item.primaryBadge,
      isSoldOut: item.status === "SOLD_OUT",
    })),
    page: dto.number + 1,
    pageSize: dto.size,
    totalCount: dto.totalElements,
    totalPages: Math.max(1, dto.totalPages),
  };
}
