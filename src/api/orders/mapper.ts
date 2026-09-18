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
} from "./validation";

function mapOrderItem(dto: OrderItemDto): OrderListItem {
  return {
    productId: dto.productId,
    thumbnail: dto.thumbnail,
    productName: dto.productName,
    price: dto.price,
    status: dto.status,
    reason: dto.reason ?? undefined,
    artisanName: dto.artisanName,
  };
}

function mapOrderGroup(dto: OrderGroupDto): OrderGroup {
  return {
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    orderedAt: dto.orderedAt,
    items: dto.items.map(mapOrderItem),
  };
}

export function mapOrderListPage(
  dto: OrderListResponseDto,
  request: { page: number; size: number },
): Page<OrderGroup> {
  return {
    items: dto.items.map(mapOrderGroup),
    page: request.page,
    pageSize: request.size,
    totalCount: dto.totalCount,
    totalPages: Math.max(1, Math.ceil(dto.totalCount / request.size)),
  };
}

export function mapOrderStatusSummary(
  dto: OrderStatusSummaryDto,
): OrderStatusSummary {
  return {
    paymentPending: dto.paymentPending,
    preparing: dto.preparing,
    shipping: dto.shipping,
    delivered: dto.delivered,
    exchangeRefund: dto.exchangeRefund,
    canceled: dto.canceled,
  };
}
