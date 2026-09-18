import { z } from "zod";

/**
 * `GET /api/member/me/orders` 응답 검증 스키마.
 * (`장인몰 주문 이력 API 계약서` v1.0, 2026-09-18 BE 확정 — 강정훈)
 *
 * Spring `Pageable` 응답 그대로(`content`/`totalElements`/`number`(0-base) 등) —
 * `api/products`의 실제 BE 연동 경로와 같은 형태. `.passthrough()`로 문서에 없는 필드는
 * 흡수한다.
 */

const returnInfoDto = z
  .object({
    type: z.enum(["EXCHANGE", "RETURN"]),
    status: z.enum(["REQUESTED", "REJECTED", "APPROVED", "COMPLETED"]),
  })
  .passthrough();

const orderItemDto = z
  .object({
    orderItemId: z.number().int(),
    productId: z.number().int(),
    productName: z.string(),
    price: z.number().int(),
    quantity: z.number().int(),
    thumbnailUrl: z.string().nullable(),
  })
  .passthrough();

/**
 * 계약서 §3-1은 `CREATED·PAID·PAYMENT_FAILED·CANCELED·DELIVERED·RETURN_REQUESTED` 6종만
 * 문서화했지만, §3-3 요약 집계 매핑 표엔 `IN_DELIVERY`가 등장한다("배송 중" 필터가 실제로
 * 동작하려면 이 값이 있어야 한다 — BE 확인 요청함, design.md §9). 확인 전까지는 존재한다고
 * 가정하고 검증 목록에 포함해둔다.
 */
const orderStatusDto = z.enum([
  "CREATED",
  "PAID",
  "PAYMENT_FAILED",
  "CANCELED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "IN_DELIVERY",
]);

const orderGroupDto = z
  .object({
    orderId: z.number().int(),
    orderNumber: z.string(),
    status: orderStatusDto,
    totalAmount: z.number().int(),
    createdAt: z.string(),
    returnInfo: returnInfoDto.nullish(),
    items: z.array(orderItemDto).min(1),
  })
  .passthrough();

export const orderListResponseDto = z
  .object({
    content: z.array(orderGroupDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    size: z.number().int(),
    /** 0-base 현재 페이지. */
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .passthrough();

export type OrderStatusDto = z.infer<typeof orderStatusDto>;
export type ReturnInfoDto = z.infer<typeof returnInfoDto>;
export type OrderItemDto = z.infer<typeof orderItemDto>;
export type OrderGroupDto = z.infer<typeof orderGroupDto>;
export type OrderListResponseDto = z.infer<typeof orderListResponseDto>;

/** `GET /api/member/me/orders/summary` 응답 검증 스키마. (계약서 §3-3) */
export const orderStatusSummaryDto = z
  .object({
    inProgress: z
      .object({
        awaitingPayment: z.number().int(),
        preparing: z.number().int(),
        inDelivery: z.number().int(),
        delivered: z.number().int(),
      })
      .passthrough(),
    closedCount: z
      .object({
        returnOrExchange: z.number().int(),
        canceled: z.number().int(),
      })
      .passthrough(),
  })
  .passthrough();

export type OrderStatusSummaryDto = z.infer<typeof orderStatusSummaryDto>;
