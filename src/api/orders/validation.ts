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

/**
 * BE는 이미지를 `docs/api-contract.md` §2.2의 `ImageRef`(variants 배열) 계약이 아니라,
 * 원본 URL 하나를 담은 배열로 내려준다(`MemberReadRepositoryImpl#thumbnail` 직접 확인,
 * 이미지 없으면 `[]`). CodeRabbit 리뷰로 발견 — 이 계약 괴리 자체는 BE에 별도 확인 요청함.
 */
const orderThumbnailDto = z.array(z.object({ url: z.string() }).passthrough());

const orderItemDto = z
  .object({
    orderItemId: z.number().int(),
    productId: z.number().int(),
    productName: z.string(),
    price: z.number().int(),
    quantity: z.number().int(),
    thumbnail: orderThumbnailDto,
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

/**
 * `GET /api/member/me/orders/{orderId}` 응답 검증 스키마.
 *
 * 실제 BE 응답(`MemberReadRepositoryImpl#orderDetail`)엔 `paymentMethod`·`shippingAmount`가
 * 없다(컬럼은 있는데 조회 쿼리가 안 읽음 — `be-requests.md` #3 요청함). `artisanName`·
 * `options`도 없다(#4). 전부 optional/nullable로 두고, 없으면 매퍼가 안전한 기본값으로
 * 채운다 — 필드 자체는 실제 계약에 반영될 걸 대비해 남겨둔다.
 */
const orderAddressDto = z
  .object({
    addressId: z.number().int().nullable(),
    recipientName: z.string(),
    phone: z.string(),
    zipCode: z.string(),
    address1: z.string(),
    address2: z.string(),
  })
  .passthrough();

const orderDetailItemDto = z
  .object({
    orderItemId: z.number().int(),
    productId: z.number().int(),
    productName: z.string(),
    price: z.number().int(),
    quantity: z.number().int(),
    thumbnail: orderThumbnailDto,
    artisanName: z.string().nullish(),
    options: z.array(z.string()).optional(),
  })
  .passthrough();

export const orderDetailResponseDto = z
  .object({
    orderId: z.number().int(),
    orderNumber: z.string(),
    status: orderStatusDto,
    totalAmount: z.number().int(),
    createdAt: z.string(),
    returnInfo: returnInfoDto.nullish(),
    items: z.array(orderDetailItemDto).min(1),
    address: orderAddressDto,
    shippingAmount: z.number().int().optional(),
    paymentMethod: z.string().nullish(),
    discountAmount: z.number().int().optional(),
    pointsUsed: z.number().int().optional(),
    /**
     * 목업 전용 필드 — "구매 확정" 상태는 BE에 대응 상태값 자체가 없다(`be-requests.md` #6).
     * 실제 계약이 생기면 이 필드 대신 `status` 유니온에 값이 추가될 것이다.
     */
    purchaseConfirmed: z.boolean().optional(),
  })
  .passthrough();

export type OrderAddressDto = z.infer<typeof orderAddressDto>;
export type OrderDetailItemDto = z.infer<typeof orderDetailItemDto>;
export type OrderDetailResponseDto = z.infer<typeof orderDetailResponseDto>;

/**
 * `GET /api/payments/orders/{orderId}/delivery` 응답 검증 스키마.
 * BE가 스마트택배 원본 응답을 3단계로 뭉뚱그려 반환한다(`be-requests.md` #5) —
 * 이동 이력·`carrierCode`는 없다.
 */
export const orderDeliveryResponseDto = z
  .object({
    orderId: z.number().int(),
    carrier: z.string(),
    trackingNumber: z.string(),
    status: z.enum(["SHIPPED", "IN_TRANSIT", "DELIVERED"]),
  })
  .passthrough();

export type OrderDeliveryResponseDto = z.infer<typeof orderDeliveryResponseDto>;

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
