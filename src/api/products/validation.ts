import { z } from "zod";

/**
 * `GET /api/products` 응답 검증 스키마. (docs/data-layer.md §4.3)
 * 목록 item 스키마만 명시하고 전부 `.passthrough()` — BE가 필드를 더 줘도 안 깨진다.
 * 페이지네이션 응답 필드(`page`/`size`/`totalPages` 등)는 BE 확정 대기라 명시하지 않고
 * passthrough로 흡수한다. FE는 요청 파라미터에서 페이지 정보를 채운다(mapper).
 *
 * FIXME 중첩 artisan·thumbnail은 기존 FE 잠정 계약을 유지한다. BE 공개조회 문서와
 * 협업 문서의 이미지 형태가 서로 다르므로 실제 응답 확정 후 mapper와 함께 조정한다.
 * docs/api-contract.md §5의 PL-2 연결 상태를 참고한다.
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
    // TODO 색상 옵션 응답 확정 전까지 선택 필드로 수용한다.
    colors: z
      .array(
        z.object({
          name: z.string(),
          hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        }),
      )
      .optional(),
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
