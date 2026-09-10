import { z } from "zod";

/**
 * `GET /api/products` 응답 검증 스키마. (docs/data-layer.md §4.3)
 * 목록 item 스키마만 명시하고 전부 `.passthrough()` — BE가 필드를 더 줘도 안 깨진다.
 * 페이지네이션 응답 필드(`page`/`size`/`totalPages` 등)는 BE 확정 대기라 명시하지 않고
 * passthrough로 흡수한다. FE는 요청 파라미터에서 페이지 정보를 채운다(mapper).
 *
 * FIXME 필드명·형태(중첩 `artisan`, `{ imageId, variants }` 형태 `thumbnail`)는 BE 공개조회
 * 계약서 원문 미확보 상태의 **잠정값**이다. api-contract.md §5 + IA 카드 명세에서 역산했다.
 * 실제 계약과의 대조·확장은 상품 목록 도메인 계약 작업에서 한다.
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
    // ID·금액·카운트는 Long 계약이라 정수만 허용한다. (docs/api-contract.md §2.2)
    id: z.number().int(),
    name: z.string(),
    price: z.number().int(),
    thumbnail: imageRefDto,
    artisan: z.object({ id: z.number().int(), name: z.string() }).passthrough(),
    craftCategory: z.string().nullish(),
    // rating만 소수, 후기 0건이면 null. (docs/api-contract.md §2.2)
    rating: z.number().nullable(),
    reviewCount: z.number().int(),
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
