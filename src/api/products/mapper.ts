import type { Page } from "@/types/api";

import type { ProductSummary } from "./model";
import type { ProductListResponseDto, ProductSummaryDto } from "./validation";

export function mapProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: dto.id,
    name: dto.name,
    price: dto.price,
    thumbnail: {
      imageId: dto.thumbnail.imageId,
      variants: dto.thumbnail.variants.map((variant) => ({
        width: variant.width,
        url: variant.url,
        format: variant.format,
      })),
    },
    artisan: { id: dto.artisan.id, name: dto.artisan.name },
    craftCategory: dto.craftCategory ?? null,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    primaryBadge: dto.primaryBadge,
    isSoldOut: dto.status === "SOLD_OUT",
    colors: dto.colors?.map((color) => ({ name: color.name, hex: color.hex })),
  };
}

/**
 * 페이지 정보는 응답이 아니라 **요청 파라미터에서 채운다**. BE 페이지네이션 응답 형태가
 * 확정되면 응답값 우선으로 바꾼다. (docs/api-contract.md §2.4)
 */
export function mapProductListPage(
  dto: ProductListResponseDto,
  request: { page: number; size: number },
): Page<ProductSummary> {
  return {
    items: dto.items.map(mapProductSummary),
    page: request.page,
    pageSize: request.size,
    totalCount: dto.totalCount,
    totalPages: Math.max(1, Math.ceil(dto.totalCount / request.size)),
  };
}
