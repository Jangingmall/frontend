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

/**
 * 주문 상세 화면(`/mypage/orders/[orderId]`)이 다루는 상품 한 줄. `OrderListItem`과 달리
 * 옵션·아이템 주문번호·제작자(장인) 이름을 더 담는다 — 목록 API엔 없는 정보라
 * `OrderListItem`을 확장하지 않고 별도로 선언한다(T-28 design.md §3).
 *
 * `artisanName`은 실제 BE 응답에 없는 필드다(조인 한 단계 부족 — `be-requests.md` #4) —
 * 응답에 없으면 `null`, 목업은 항상 채워서 내려준다.
 */
export interface OrderDetailItem {
  orderItemId: number;
  productId: number;
  productName: string;
  price: Money;
  quantity: number;
  thumbnailUrl: string | null;
  /** Figma 최대 4줄 — 실제 개수만큼(BE 미제공, 목업 전용 확장). */
  options: string[];
  /** 주문 단위 계산값 복제 — `OrderListItem.status`와 같은 이유(BE는 아이템별 상태가 없다). */
  status: OrderStatus;
  artisanName: string | null;
  /**
   * 교환/환불/취소 사유 — 실제 계약엔 없는 필드다(`returnInfo`엔 `type`·`status`만 있음,
   * 취소도 마찬가지). BE 미제공, 목업 전용 확장(`artisanName`과 같은 패턴) — 응답에 없으면
   * `null`, 상태별 사유 배너(Figma `1718:16488`)를 보여줄 때 쓴다.
   */
  reason: string | null;
  /**
   * 주문 취소 주체 — `CANCELED` 상태에서만 의미 있다. 사유 유무만으론 소비자·장인 취소를
   * 못 가른다(실측 결과 둘 다 사유 배너가 있음, constants/order.ts 참고). BE 미제공,
   * 목업 전용 확장.
   */
  cancelInitiator: "consumer" | "artisan" | null;
}

/** 제작자(장인) 이름 기준으로 묶은 상품 그룹 — Figma가 장인별로 섹션을 나눠 보여준다. */
export interface OrderDetailArtisanGroup {
  artisanName: string | null;
  items: OrderDetailItem[];
}

/** 주문 배송지. 회원 배송지 목록(`Address`)과 달리 `id`가 없다 — 이 주문에 스냅샷된 값이라
 * 회원 배송지 레코드와 독립적이다. */
export interface OrderShippingAddress {
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
}

/**
 * 주문 결제 정보. `discountAmount`·`pointsUsed`는 BE에 관련 컬럼 자체가 없다(쿠폰·적립금
 * 제도 미구현 — `be-requests.md` #3) — 항상 0. `paymentMethod`도 BE 응답에 없어(같은 항목)
 * `null`이면 화면이 "-"로 표시한다.
 */
export interface OrderPaymentSummary {
  productAmount: Money;
  shippingAmount: Money;
  discountAmount: Money;
  pointsUsed: Money;
  totalAmount: Money;
  paymentMethod: string | null;
}

/** 주문 상세 전체. */
export interface OrderDetail {
  orderId: number;
  orderNumber: string;
  /** ISO datetime */
  orderedAt: string;
  groups: OrderDetailArtisanGroup[];
  shippingAddress: OrderShippingAddress;
  payment: OrderPaymentSummary;
}

/**
 * 주문 배송 조회(OD-2). BE가 스마트택배(SweetTracker) 원본 응답 중 상태값만 남기고
 * 이동 이력·택배사 코드는 버린다(`be-requests.md` #5) — 그래서 3단계 상태만 표현한다.
 */
export interface OrderDelivery {
  orderId: number;
  carrier: string;
  trackingNumber: string;
  status: "SHIPPED" | "IN_TRANSIT" | "DELIVERED";
}
