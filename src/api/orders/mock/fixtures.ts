import dayjs from "dayjs";

import type {
  OrderItemDto,
  OrderStatusDto,
  ReturnInfoDto,
} from "@/api/orders/validation";

/** 순환 참조용 상품·장인 이름 풀. 장인 이름은 계약서에 없는 필드라 DTO엔 안 실리지만,
 * 목업 핸들러가 `artisanName` 검색(서버사이드 검색을 흉내)을 걸러낼 때만 내부적으로 쓴다. */
const PRODUCT_POOL: {
  name: string;
  artisanName: string;
  price: number;
}[] = [
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
  return PRODUCT_POOL[seq % PRODUCT_POOL.length]!;
}

function orderNumber(orderId: number): string {
  return `ORD${String(orderId).padStart(11, "0")}`;
}

/** 오늘부터 `daysAgo`일 전 ISO datetime — 기간 프리셋(오늘~12개월)이 서로 다른 결과를 내도록
 * 실행 시점 기준 상대값으로 둔다(랜덤은 아님 — 오프셋은 고정 배열). */
function createdAt(daysAgo: number): string {
  return dayjs().subtract(daysAgo, "day").toISOString();
}

/** `artisanName`은 계약(`OrderItemDto`)엔 없는 목업 전용 확장 필드 — 핸들러의 검색 필터용. */
type OrderItemFixture = OrderItemDto & { artisanName: string };

function item(seq: number, quantity = 1): OrderItemFixture {
  const p = pool(seq);
  return {
    orderItemId: 9000 + seq,
    productId: 1000 + seq,
    productName: p.name,
    price: p.price,
    quantity,
    thumbnailUrl: `https://cdn.midam.store/products/${1000 + seq}.jpg`,
    artisanName: p.artisanName,
  };
}

/**
 * `OrderGroupDto`에서 직접 `Omit`하지 않고 여기서 새로 선언한다 — 그 타입은 zod
 * `.passthrough()` 인덱스 시그니처(`[x: string]: unknown`)를 가진 채로 추론돼 있어,
 * `Omit<OrderGroupDto, "items">`을 쓰면 `createdAt` 같은 명시 필드까지 `unknown`으로
 * 넓어지는 TS 알려진 동작(Omit + 인덱스 시그니처)이 있다.
 */
interface OrderGroupFixture {
  orderId: number;
  orderNumber: string;
  status: OrderStatusDto;
  totalAmount: number;
  createdAt: string;
  returnInfo?: ReturnInfoDto;
  items: OrderItemFixture[];
}

// 단일 상품 주문 — BE 원본 상태(§3-1) + returnInfo(§4) 조합별로 최소 1건.
// "주문 확인 중"(ORDER_PENDING)·"구매 확정"(PURCHASE_CONFIRMED)은 대응하는 BE 값이 없어
// 별도 시나리오를 못 만든다(design.md §9 — PAID/DELIVERED로 흡수됨).
const SINGLE_STATUS_ORDERS: {
  status: OrderStatusDto;
  daysAgo: number;
  returnInfo?: ReturnInfoDto;
}[] = [
  { status: "CREATED", daysAgo: 0 },
  { status: "PAID", daysAgo: 5 },
  { status: "IN_DELIVERY", daysAgo: 6 },
  { status: "DELIVERED", daysAgo: 20 },
  { status: "CANCELED", daysAgo: 45 },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 75,
    returnInfo: { type: "EXCHANGE", status: "REQUESTED" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 80,
    returnInfo: { type: "EXCHANGE", status: "REJECTED" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 100,
    returnInfo: { type: "EXCHANGE", status: "APPROVED" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 140,
    returnInfo: { type: "RETURN", status: "REQUESTED" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 170,
    returnInfo: { type: "RETURN", status: "REJECTED" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 200,
    returnInfo: { type: "RETURN", status: "APPROVED" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 230,
    returnInfo: { type: "RETURN", status: "COMPLETED" },
  },
];

const singleOrders: OrderGroupFixture[] = SINGLE_STATUS_ORDERS.map(
  (spec, index) => {
    const orderId = 5001 + index;
    return {
      orderId,
      orderNumber: orderNumber(orderId),
      status: spec.status,
      totalAmount: pool(index).price,
      createdAt: createdAt(spec.daysAgo),
      returnInfo: spec.returnInfo,
      items: [item(index)],
    };
  },
);

// 다중 상품 주문 4건 — 계약상 상태는 주문 전체에 하나뿐이라 아이템은 전부 같은 상태를 공유한다.
const MULTI_ITEM_ORDERS: { status: OrderStatusDto; daysAgo: number }[] = [
  { status: "PAID", daysAgo: 10 },
  { status: "PAID", daysAgo: 90 },
  { status: "DELIVERED", daysAgo: 260 },
  { status: "IN_DELIVERY", daysAgo: 320 },
];

const multiOrders: OrderGroupFixture[] = MULTI_ITEM_ORDERS.map(
  (spec, index) => {
    const orderId = 5101 + index;
    const itemCount = 2 + (index % 2);
    const items = Array.from({ length: itemCount }, (_, itemIndex) =>
      item(20 + index * 3 + itemIndex, 1 + (itemIndex % 2)),
    );
    return {
      orderId,
      orderNumber: orderNumber(orderId),
      status: spec.status,
      totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      createdAt: createdAt(spec.daysAgo),
      items,
    };
  },
);

// size=10 기준 3페이지 이상 나오도록 흔한 상태(결제완료 등)로 패딩.
const PADDING_STATUSES: { status: OrderStatusDto; daysAgo: number }[] = [
  { status: "DELIVERED", daysAgo: 15 },
  { status: "PAID", daysAgo: 30 },
  { status: "CREATED", daysAgo: 1 },
  { status: "IN_DELIVERY", daysAgo: 8 },
  { status: "DELIVERED", daysAgo: 55 },
  { status: "PAID", daysAgo: 4 },
  { status: "DELIVERED", daysAgo: 110 },
];

const paddingOrders: OrderGroupFixture[] = PADDING_STATUSES.map(
  (spec, index) => {
    const orderId = 5201 + index;
    return {
      orderId,
      orderNumber: orderNumber(orderId),
      status: spec.status,
      totalAmount: pool(40 + index).price,
      createdAt: createdAt(spec.daysAgo),
      items: [item(40 + index)],
    };
  },
);

/** `GET /api/member/me/orders` mock 데이터. 최신순(주문일 내림차순)으로 정렬해둔다. */
export const orderFixtures: OrderGroupFixture[] = [
  ...singleOrders,
  ...multiOrders,
  ...paddingOrders,
].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
