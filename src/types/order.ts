import type { OrderStatus } from "@/constants/order";
import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";

/** 마이페이지 주문 목록(`/mypage/orders`)이 다루는 주문 상품 한 줄. */
export interface OrderListItem {
  productId: number;
  thumbnail: ImageRef;
  productName: string;
  price: Money;
  status: OrderStatus;
  /** "{상태 라벨} 사유 : {reason}" 조합용. 있을 때만. */
  reason?: string;
  /** 장인 이름 검색 전용 — 카드엔 표시하지 않는다(design.md §5.1). */
  artisanName: string;
}

/** 주문 하나(상품 1개 이상). */
export interface OrderGroup {
  orderId: number;
  orderNumber: string;
  /** ISO datetime */
  orderedAt: string;
  items: OrderListItem[];
}

/** "내 주문 현황" 요약 스트립 — 최근 3개월 고정 기준(design.md §5.2). */
export interface OrderStatusSummary {
  paymentPending: number;
  preparing: number;
  shipping: number;
  delivered: number;
  exchangeRefund: number;
  canceled: number;
}
