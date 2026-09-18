import type { OrderStatus } from "@/constants/order";
import type { Money } from "@/types/money";

/**
 * 마이페이지 주문 목록(`/mypage/orders`)이 다루는 주문 상품 한 줄.
 *
 * BE 계약(`장인몰 주문 이력 API 계약서` v1.0) 확정 결과 — `status`는 원래 아이템이 아니라
 * **주문 전체**에 하나만 있다(아이템별 상태 없음). `reason`(사유 텍스트)도 계약에 없다.
 * `status`는 매퍼가 주문 단위로 한 번 계산해 모든 아이템에 동일하게 복제해 넣는다 — 나중에
 * BE가 아이템별 상태를 실제로 지원하면 이 복제만 걷어내면 되도록 필드 자체는 유지한다
 * (2026-09-18 논의).
 */
export interface OrderListItem {
  productId: number;
  productName: string;
  price: Money;
  quantity: number;
  /** BE는 3-variant `ImageRef`가 아니라 단일 CDN URL 문자열(또는 `null`)만 준다. */
  thumbnailUrl: string | null;
  status: OrderStatus;
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
