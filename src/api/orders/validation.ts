import { z } from "zod";

import { ORDER_STATUS, type OrderStatus } from "@/constants/order";

/**
 * `GET /api/member/me/orders` 응답 검증 스키마. (design.md §5.1 — BE에 아직 없는 목업 계약)
 * item 스키마만 명시하고 `.passthrough()`로 나머지는 흡수한다.
 */

const orderStatusValues = Object.values(ORDER_STATUS) as [
  OrderStatus,
  ...OrderStatus[],
];

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

const orderItemDto = z
  .object({
    productId: z.number().int(),
    thumbnail: imageRefDto,
    productName: z.string(),
    price: z.number().int(),
    // 지금은 100% 목업(design.md §5.3 — BE는 이 14종을 아직 표현 못함)이라 우리 픽스처가
    // 유일한 데이터 출처다. `ORDER_STATUS` 14종으로 엄격 검증해 픽스처 오타를 여기서 잡는다 —
    // 실제 BE 연동 시 이 스키마 자체를 교체해야 한다(unknown-safe로 되돌릴 수 있음).
    status: z.enum(orderStatusValues),
    reason: z.string().nullish(),
    artisanName: z.string(),
  })
  .passthrough();

const orderGroupDto = z
  .object({
    orderId: z.number().int(),
    orderNumber: z.string(),
    orderedAt: z.string(),
    items: z.array(orderItemDto).min(1),
  })
  .passthrough();

export const orderListResponseDto = z
  .object({
    items: z.array(orderGroupDto),
    totalCount: z.number(),
  })
  .passthrough();

export type OrderItemDto = z.infer<typeof orderItemDto>;
export type OrderGroupDto = z.infer<typeof orderGroupDto>;
export type OrderListResponseDto = z.infer<typeof orderListResponseDto>;

/** `GET /api/member/me/orders/summary` 응답 검증 스키마. (design.md §5.2 — 신규 엔드포인트 가정) */
export const orderStatusSummaryDto = z
  .object({
    paymentPending: z.number().int(),
    preparing: z.number().int(),
    shipping: z.number().int(),
    delivered: z.number().int(),
    exchangeRefund: z.number().int(),
    canceled: z.number().int(),
  })
  .passthrough();

export type OrderStatusSummaryDto = z.infer<typeof orderStatusSummaryDto>;
