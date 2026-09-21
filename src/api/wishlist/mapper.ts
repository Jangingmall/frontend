import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import type { WishlistPageDto } from "./validation";

export function mapWishlistPage(dto: WishlistPageDto): Page<ProductSummary> {
  return {
    items: dto.content.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      thumbnail: null,
      // 실제 BE는 단일 썸네일 URL만 준다 — `mapBackendProductList`와 동일 패턴.
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
