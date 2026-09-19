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
    thumbnail: [{ url: `https://cdn.midam.store/products/${1000 + seq}.jpg` }],
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
  /**
   * `status === "CANCELED"`일 때만 쓴다 — 상세 화면 사유 배너 목업용
   * (`OrderDetailFixture`로 그대로 전달됨). 실제 계약엔 없는 목업 전용 필드.
   */
  cancelReason?: string;
  canceledBy?: "CONSUMER" | "ARTISAN";
  items: OrderItemFixture[];
}

// 단일 상품 주문 — BE 원본 상태(§3-1) + returnInfo(§4) 조합별로 최소 1건.
// "주문 확인 중"(ORDER_PENDING)·"구매 확정"(PURCHASE_CONFIRMED)은 대응하는 BE 값이 없어
// 별도 시나리오를 못 만든다(design.md §9 — PAID/DELIVERED로 흡수됨).
const SINGLE_STATUS_ORDERS: {
  status: OrderStatusDto;
  daysAgo: number;
  returnInfo?: ReturnInfoDto;
  cancelReason?: string;
  canceledBy?: "CONSUMER" | "ARTISAN";
}[] = [
  { status: "CREATED", daysAgo: 0 },
  { status: "PAID", daysAgo: 5 },
  { status: "IN_DELIVERY", daysAgo: 6 },
  { status: "DELIVERED", daysAgo: 20 },
  // 취소는 실측(Figma 1718:16488) 결과 소비자·장인 2가지로 갈려 각각 1건씩 둔다
  // (constants/order.ts `getOrderDetailActions` CANCELED 분기 참고).
  {
    status: "CANCELED",
    daysAgo: 40,
    cancelReason: "단순 변심",
    canceledBy: "CONSUMER",
  },
  {
    status: "CANCELED",
    daysAgo: 45,
    cancelReason: "주문 승인 거절 ( 작업 불가 )",
    canceledBy: "ARTISAN",
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 75,
    returnInfo: { type: "EXCHANGE", status: "REQUESTED", reason: "제품 파손" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 80,
    returnInfo: {
      type: "EXCHANGE",
      status: "REJECTED",
      reason: "상품 사용에 따른 파손",
    },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 100,
    returnInfo: { type: "EXCHANGE", status: "APPROVED" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 140,
    returnInfo: { type: "RETURN", status: "REQUESTED", reason: "제품 파손" },
  },
  {
    status: "RETURN_REQUESTED",
    daysAgo: 170,
    returnInfo: {
      type: "RETURN",
      status: "REJECTED",
      reason: "상품 사용에 따른 파손",
    },
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
      cancelReason: spec.cancelReason,
      canceledBy: spec.canceledBy,
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

/**
 * 주문 상세(`GET /api/member/me/orders/{orderId}`) mock 전용 확장 데이터.
 * `orderFixtures`(목록)와 같은 `orderId`를 그대로 써서 목록→상세 이동이 항상 이어지게 한다.
 * 실제 BE엔 없는 필드(옵션·배송지·결제수단·배송비 등, `be-requests.md` #3·#4)를 여기서
 * 목업으로만 채운다. `orderId`로 찾아 in-place로 수정하는 mutation 핸들러가 쓰므로
 * `Map`(참조가 유지되는 mutable 객체)으로 둔다.
 */

const OPTION_POOL = [
  "색상: 백자색",
  "사이즈: 중",
  "포장: 선물 포장",
  "각인: 미포함",
];

function options(seq: number): string[] {
  const count = 1 + (seq % 3);
  return Array.from(
    { length: count },
    (_, offset) => OPTION_POOL[(seq + offset) % OPTION_POOL.length]!,
  );
}

const ADDRESS_POOL: {
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
}[] = [
  {
    recipientName: "홍길동",
    phone: "01012345678",
    zipCode: "06236",
    address1: "서울특별시 강남구 테헤란로 123",
    address2: "미담빌딩 5층",
  },
  {
    recipientName: "김미담",
    phone: "01098765432",
    zipCode: "48058",
    address1: "부산광역시 해운대구 센텀로 45",
    address2: "101동 1502호",
  },
];

/** `components/order/PaymentsMethod.tsx`의 4종과 값을 맞춘다(결제 화면과 같은 도메인 값). */
const PAYMENT_METHOD_POOL = [
  "CARD",
  "TOSS_PAY",
  "REALTIME_TRANSFER",
  "BANK_TRANSFER",
] as const;

export interface OrderDetailFixture {
  orderId: number;
  orderNumber: string;
  status: OrderStatusDto;
  returnInfo?: ReturnInfoDto;
  cancelReason?: string;
  canceledBy?: "CONSUMER" | "ARTISAN";
  createdAt: string;
  items: (OrderItemFixture & { options: string[] })[];
  address: {
    addressId: number | null;
    recipientName: string;
    phone: string;
    zipCode: string;
    address1: string;
    address2: string;
  };
  shippingAmount: number;
  paymentMethod: string;
  discountAmount: number;
  pointsUsed: number;
  /** "구매 확정" — BE에 대응 상태값이 없어 목업 전용 플래그로 표현한다(§6 요청함). */
  purchaseConfirmed: boolean;
}

/** `orderId` → 상세 mock 데이터. mutation 핸들러가 in-place로 수정한다. */
export const orderDetailFixtures = new Map<number, OrderDetailFixture>(
  orderFixtures.map((order, index) => [
    order.orderId,
    {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      returnInfo: order.returnInfo,
      cancelReason: order.cancelReason,
      canceledBy: order.canceledBy,
      createdAt: order.createdAt,
      items: order.items.map((item, itemIndex) => ({
        ...item,
        options: options(index * 10 + itemIndex),
      })),
      address: {
        addressId: 9000 + index,
        ...ADDRESS_POOL[index % ADDRESS_POOL.length]!,
      },
      shippingAmount: 3000,
      paymentMethod: PAYMENT_METHOD_POOL[index % PAYMENT_METHOD_POOL.length]!,
      discountAmount: 0,
      pointsUsed: 0,
      purchaseConfirmed: false,
    },
  ]),
);
