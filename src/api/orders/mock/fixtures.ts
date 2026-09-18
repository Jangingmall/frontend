import dayjs from "dayjs";

import type { OrderListResponseDto } from "@/api/orders/validation";
import { ORDER_STATUS, type OrderStatus } from "@/constants/order";
import { seedImageRef } from "@/mocks/seed";

type OrderItemFixture = OrderListResponseDto["items"][number]["items"][number];
type OrderGroupFixture = OrderListResponseDto["items"][number];

/** 순환 참조용 상품·장인 이름 풀. 상태·기간 다양성을 보여주는 데 목적이 있어 실제 카탈로그와
 * 겹치지 않는다. */
const PRODUCT_POOL: { name: string; artisanName: string; price: number }[] = [
  { name: "백자 달항아리", artisanName: "김도예", price: 320000 },
  { name: "옻칠 3단 찬합", artisanName: "이나전", price: 189000 },
  { name: "유기 반상기 세트", artisanName: "박유기", price: 450000 },
  { name: "한지 조명갓", artisanName: "정한지", price: 98000 },
  { name: "소반 다과상", artisanName: "최소목", price: 156000 },
  { name: "무명 자수 방석", artisanName: "한자수", price: 72000 },
  { name: "청자 다기 세트", artisanName: "송청자", price: 280000 },
  { name: "대나무 채반", artisanName: "임죽공", price: 45000 },
  { name: "놋그릇 5첩 반상기", artisanName: "강유기", price: 520000 },
  { name: "천연염색 스카프", artisanName: "윤염색", price: 65000 },
];

function pool(seq: number) {
  return PRODUCT_POOL[seq % PRODUCT_POOL.length];
}

function orderNumber(orderId: number): string {
  return `JJ${String(orderId).padStart(6, "0")}`;
}

/** 오늘부터 `daysAgo`일 전 ISO datetime — 기간 프리셋(오늘~12개월)이 서로 다른 결과를 내도록
 * 실행 시점 기준 상대값으로 둔다(랜덤은 아님 — 오프셋은 고정 배열). */
function orderedAt(daysAgo: number): string {
  return dayjs().subtract(daysAgo, "day").toISOString();
}

function item(
  seq: number,
  status: OrderStatus,
  reason?: string,
): OrderItemFixture {
  const p = pool(seq);
  return {
    productId: 1000 + seq,
    thumbnail: seedImageRef(seq),
    productName: p.name,
    price: p.price,
    status,
    ...(reason ? { reason } : {}),
    artisanName: p.artisanName,
  };
}

// 14개 상태 각각 최소 1건(단일 상품) — 기간을 0~350일 전으로 분산.
const SINGLE_STATUS_ORDERS: {
  status: OrderStatus;
  daysAgo: number;
  reason?: string;
}[] = [
  { status: ORDER_STATUS.PAYMENT_PENDING, daysAgo: 0 },
  { status: ORDER_STATUS.ORDER_PENDING, daysAgo: 2 },
  { status: ORDER_STATUS.PREPARING, daysAgo: 5 },
  { status: ORDER_STATUS.SHIPPING, daysAgo: 6 },
  { status: ORDER_STATUS.DELIVERED, daysAgo: 20 },
  { status: ORDER_STATUS.PURCHASE_CONFIRMED, daysAgo: 40 },
  {
    status: ORDER_STATUS.CANCELED,
    daysAgo: 45,
    reason: "주문 승인 거절 ( 작업 불가 )",
  },
  { status: ORDER_STATUS.EXCHANGE_REQUESTED, daysAgo: 75 },
  {
    status: ORDER_STATUS.EXCHANGE_REJECTED,
    daysAgo: 80,
    reason: "상품 사용에 따른 파손",
  },
  { status: ORDER_STATUS.EXCHANGE_APPROVED, daysAgo: 100 },
  { status: ORDER_STATUS.REFUND_REQUESTED, daysAgo: 140 },
  {
    status: ORDER_STATUS.REFUND_REJECTED,
    daysAgo: 170,
    reason: "상품 사용에 따른 파손",
  },
  { status: ORDER_STATUS.REFUND_APPROVED, daysAgo: 200 },
  { status: ORDER_STATUS.REFUND_COMPLETED, daysAgo: 230 },
];

const singleOrders: OrderGroupFixture[] = SINGLE_STATUS_ORDERS.map(
  (spec, index) => {
    const orderId = 5001 + index;
    return {
      orderId,
      orderNumber: orderNumber(orderId),
      orderedAt: orderedAt(spec.daysAgo),
      items: [item(index, spec.status, spec.reason)],
    };
  },
);

// 다중 상품 주문 4건 — 아이템별로 다른 상태 조합(T-21 §0-1 실측 예시 그대로).
const MULTI_ITEM_ORDERS: {
  daysAgo: number;
  statuses: OrderStatus[];
}[] = [
  { daysAgo: 10, statuses: [ORDER_STATUS.PREPARING, ORDER_STATUS.DELIVERED] },
  {
    daysAgo: 90,
    statuses: [
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.PREPARING,
    ],
  },
  {
    daysAgo: 260,
    statuses: [ORDER_STATUS.DELIVERED, ORDER_STATUS.PURCHASE_CONFIRMED],
  },
  {
    daysAgo: 320,
    statuses: [
      ORDER_STATUS.SHIPPING,
      ORDER_STATUS.SHIPPING,
      ORDER_STATUS.PREPARING,
    ],
  },
];

const multiOrders: OrderGroupFixture[] = MULTI_ITEM_ORDERS.map(
  (spec, index) => {
    const orderId = 5101 + index;
    return {
      orderId,
      orderNumber: orderNumber(orderId),
      orderedAt: orderedAt(spec.daysAgo),
      items: spec.statuses.map((status, itemIndex) =>
        item(20 + index * 3 + itemIndex, status),
      ),
    };
  },
);

// size=10 기준 3페이지 이상 나오도록 흔한 상태(배송완료 등)로 패딩.
const PADDING_STATUSES: { status: OrderStatus; daysAgo: number }[] = [
  { status: ORDER_STATUS.DELIVERED, daysAgo: 15 },
  { status: ORDER_STATUS.PURCHASE_CONFIRMED, daysAgo: 30 },
  { status: ORDER_STATUS.PAYMENT_PENDING, daysAgo: 1 },
  { status: ORDER_STATUS.SHIPPING, daysAgo: 8 },
  { status: ORDER_STATUS.DELIVERED, daysAgo: 55 },
  { status: ORDER_STATUS.PREPARING, daysAgo: 4 },
  { status: ORDER_STATUS.PURCHASE_CONFIRMED, daysAgo: 110 },
];

const paddingOrders: OrderGroupFixture[] = PADDING_STATUSES.map(
  (spec, index) => {
    const orderId = 5201 + index;
    return {
      orderId,
      orderNumber: orderNumber(orderId),
      orderedAt: orderedAt(spec.daysAgo),
      items: [item(40 + index, spec.status)],
    };
  },
);

/** `GET /api/member/me/orders` mock 데이터. 최신순(주문일 내림차순)으로 정렬해둔다. */
export const orderFixtures: OrderGroupFixture[] = [
  ...singleOrders,
  ...multiOrders,
  ...paddingOrders,
].sort((a, b) => (a.orderedAt < b.orderedAt ? 1 : -1));
