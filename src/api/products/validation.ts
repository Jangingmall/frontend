import { z } from "zod";

/**
 * `GET /api/products` 응답 검증 스키마. (docs/data-layer.md §4.3)
 * 목록 item 스키마만 명시하고 전부 `.passthrough()` — BE가 필드를 더 줘도 안 깨진다.
 * 페이지네이션 응답 필드(`page`/`size`/`totalPages` 등)는 BE 확정 대기라 명시하지 않고
 * passthrough로 흡수한다. FE는 요청 파라미터에서 페이지 정보를 채운다(mapper).
 */

const imageVariantDto = z
  .object({
    width: z.union([z.literal(320), z.literal(640), z.literal(1280)]),
    url: z.string(),
    format: z.literal("webp"),
  })
  .passthrough();

const imageRefDto = z
  .object({
    imageId: z.string(),
    variants: z.array(imageVariantDto),
  })
  .passthrough();

const productSummaryDto = z
  .object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    thumbnail: imageRefDto,
    artisan: z.object({ id: z.number(), name: z.string() }).passthrough(),
    craftCategory: z.string().nullish(),
    rating: z.number().nullable(),
    reviewCount: z.number(),
    primaryBadge: z.string().nullable(),
    // 공개 목록 응답에는 ON_SALE / SOLD_OUT 만 나온다. (docs/api-contract.md §5)
    status: z.enum(["ON_SALE", "SOLD_OUT"]),
  })
  .passthrough();

export const productListResponseDto = z
  .object({
    items: z.array(productSummaryDto),
    totalCount: z.number(),
  })
  .passthrough();

export type ProductSummaryDto = z.infer<typeof productSummaryDto>;
export type ProductListResponseDto = z.infer<typeof productListResponseDto>;
