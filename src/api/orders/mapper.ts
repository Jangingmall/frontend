import { ORDER_STATUS, type OrderStatus } from "@/constants/order";
import type { Page } from "@/types/api";
import type {
  OrderGroup,
  OrderListItem,
  OrderStatusSummary,
} from "@/types/order";

import type {
  OrderGroupDto,
  OrderItemDto,
  OrderListResponseDto,
  OrderStatusSummaryDto,
  ReturnInfoDto,
} from "./validation";

/**
 * BE 원본 상태(§3-1, `장인몰 주문 이력 API 계약서` v1.0) → FE 14종(`constants/order.ts`) 매핑.
 * (2026-09-18 논의로 확정된 가정 — design.md §9)
 *
 * - `CREATED` → `PAYMENT_PENDING`("입금 확인 중").
 * - `PAID` → `PREPARING`("상품 준비 중"). BE는 "주문 확인 중"(`ORDER_PENDING`)을 따로 안 두고
 *   결제 즉시 준비 단계로 취급한다 — 요약 집계 매핑(`preparing ← PAID`)과 일치하고,
 *   `ORDER_PENDING`을 `PREPARING` 그룹에 합치기로 한 필터 탭 결정과도 맞아떨어진다.
 * - `IN_DELIVERY` → `SHIPPING`("배송 중"). 계약서 §3-1엔 이 값이 없고 §3-3에만 등장 —
 *   실제로 필터링되는지 BE 확인 요청함, 확인 전까지 있다고 가정.
 * - `DELIVERED` → `DELIVERED`("배송 완료"). "구매 확정"(`PURCHASE_CONFIRMED`)을 구분할 필드가
 *   BE에 아직 없다(향후 추가 예정으로 확인) — 지금은 전부 `DELIVERED`로만 나온다.
 * - `CANCELED` → `CANCELED`.
 * - `PAYMENT_FAILED` → `null`. 마이페이지 주문 목록엔 노출하지 않기로 확정(2026-09-18) —
 *   호출측(`mapOrderGroup`)이 이 값을 받으면 해당 주문 전체를 걸러낸다.
 * - `RETURN_REQUESTED` → `returnInfo`로 세분화(아래 `mapReturnStatus`). `returnInfo`가 없는
 *   비정상 응답이면 `null`(방어적으로 걸러낸다).
 */
function mapRawOrderStatus(
  status: OrderGroupDto["status"],
  returnInfo: ReturnInfoDto | null | undefined,
): OrderStatus | null {
  switch (status) {
    case "CREATED":
      return ORDER_STATUS.PAYMENT_PENDING;
    case "PAID":
      return ORDER_STATUS.PREPARING;
    case "IN_DELIVERY":
      return ORDER_STATUS.SHIPPING;
    case "DELIVERED":
      return ORDER_STATUS.DELIVERED;
    case "CANCELED":
      return ORDER_STATUS.CANCELED;
    case "PAYMENT_FAILED":
      return null;
    case "RETURN_REQUESTED":
      return returnInfo ? mapReturnStatus(returnInfo) : null;
  }
}

/** 계약서 §4 매핑표 그대로. `EXCHANGE`+`COMPLETED`는 표에 없는 조합 — 방어적으로 `null`. */
function mapReturnStatus(returnInfo: ReturnInfoDto): OrderStatus | null {
  if (returnInfo.type === "EXCHANGE") {
    switch (returnInfo.status) {
      case "REQUESTED":
        return ORDER_STATUS.EXCHANGE_REQUESTED;
      case "REJECTED":
        return ORDER_STATUS.EXCHANGE_REJECTED;
      case "APPROVED":
        return ORDER_STATUS.EXCHANGE_APPROVED;
      case "COMPLETED":
        return null;
    }
  }
  switch (returnInfo.status) {
    case "REQUESTED":
      return ORDER_STATUS.REFUND_REQUESTED;
    case "REJECTED":
      return ORDER_STATUS.REFUND_REJECTED;
    case "APPROVED":
      return ORDER_STATUS.REFUND_APPROVED;
    case "COMPLETED":
      return ORDER_STATUS.REFUND_COMPLETED;
  }
}

/** `status`는 주문 전체 계산값을 그대로 복제해 받는다(`types/order.ts` 주석 참고). */
function mapOrderItem(dto: OrderItemDto, status: OrderStatus): OrderListItem {
  return {
    productId: dto.productId,
    productName: dto.productName,
    price: dto.price,
    quantity: dto.quantity,
    // BE는 단일 URL을 배열로 감싸 내려준다(variants 없음) — 첫 항목만 쓴다.
    thumbnailUrl: dto.thumbnail[0]?.url ?? null,
    status,
  };
}

/** 매핑 불가(결제 실패·비정상 반품 데이터) 주문은 `null` — 호출측이 목록에서 제외한다. */
function mapOrderGroup(dto: OrderGroupDto): OrderGroup | null {
  const status = mapRawOrderStatus(dto.status, dto.returnInfo);
  if (!status) return null;
  return {
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    orderedAt: dto.createdAt,
    items: dto.items.map((item) => mapOrderItem(item, status)),
  };
}

export function mapOrderListPage(dto: OrderListResponseDto): Page<OrderGroup> {
  const items = dto.content
    .map(mapOrderGroup)
    .filter((group): group is OrderGroup => group !== null);
  return {
    items,
    page: dto.number + 1, // BE 0-base → FE 1-base
    pageSize: dto.size,
    totalCount: dto.totalElements,
    totalPages: dto.totalPages,
  };
}

export function mapOrderStatusSummary(
  dto: OrderStatusSummaryDto,
): OrderStatusSummary {
  return {
    paymentPending: dto.inProgress.awaitingPayment,
    preparing: dto.inProgress.preparing,
    shipping: dto.inProgress.inDelivery,
    delivered: dto.inProgress.delivered,
    exchangeRefund: dto.closedCount.returnOrExchange,
    canceled: dto.closedCount.canceled,
  };
}
