import dayjs from "dayjs";

/**
 * 주문 상태 값 → 한글 라벨 + 상태별 액션 버튼 매트릭스. (Figma GUI 파일 마이페이지
 * "6번 항목 설명(주문 상태 별 정리)" 주석 스펙 시트 + 실제 화면 인스턴스 대조로 확정)
 *
 * BE 스키마 확인 결과(`Jangingmall/backend` ERD) `orders.status`는 5종
 * (`CREATED`/`PAID`/`PAYMENT_FAILED`/`CANCELED`/`DELIVERED`)뿐이고, 아래 14종 중
 * 교환·환불 관련 9종은 아직 BE 테이블 자체가 없다. 키 값은 `PRODUCT_BADGE`와 같은
 * 수준의 미확정 가정 — BE 계약 확정 시 키만 교체하면 된다.
 */
export const ORDER_STATUS = {
  PAYMENT_PENDING: "PAYMENT_PENDING", // 입금 확인 중
  ORDER_PENDING: "ORDER_PENDING", // 주문 확인 중
  PREPARING: "PREPARING", // 상품 준비 중
  SHIPPING: "SHIPPING", // 배송 중
  DELIVERED: "DELIVERED", // 배송 완료
  PURCHASE_CONFIRMED: "PURCHASE_CONFIRMED", // 구매 확정
  CANCELED: "CANCELED", // 주문 취소
  EXCHANGE_REQUESTED: "EXCHANGE_REQUESTED", // 교환 신청
  EXCHANGE_REJECTED: "EXCHANGE_REJECTED", // 교환 불가
  EXCHANGE_APPROVED: "EXCHANGE_APPROVED", // 교환 승인
  REFUND_REQUESTED: "REFUND_REQUESTED", // 환불 신청
  REFUND_REJECTED: "REFUND_REJECTED", // 환불 불가
  REFUND_APPROVED: "REFUND_APPROVED", // 환불 승인
  REFUND_COMPLETED: "REFUND_COMPLETED", // 환불 완료
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * `productBadgeLabel`과 달리 이 맵 자체를 export한다 — `OrderProductCard`가 이미 엄격한
 * `OrderStatus`로 타입 지정된 `status`를 갖고 있어(예: "{상태} 사유" 접두사 유도) `Record`
 * 직접 조회로 `undefined` 분기 없이 안전하게 쓸 수 있다. {@link orderStatusLabel}은 값
 * 출처가 불확실한 경우(BE 원본 문자열을 아직 검증하지 않은 상태)를 위한 방어용 경로다.
 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "입금 확인 중",
  ORDER_PENDING: "주문 확인 중",
  PREPARING: "상품 준비 중",
  SHIPPING: "배송 중",
  DELIVERED: "배송 완료",
  PURCHASE_CONFIRMED: "구매 확정",
  CANCELED: "주문 취소",
  EXCHANGE_REQUESTED: "교환 신청",
  EXCHANGE_REJECTED: "교환 불가",
  EXCHANGE_APPROVED: "교환 승인",
  REFUND_REQUESTED: "환불 신청",
  REFUND_REJECTED: "환불 불가",
  REFUND_APPROVED: "환불 승인",
  REFUND_COMPLETED: "환불 완료",
};

/** 매핑이 없으면 `undefined`를 돌려준다(호출측이 미표시 처리). */
export function orderStatusLabel(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  return ORDER_STATUS_LABEL[value as OrderStatus];
}

/**
 * `OrderProductCard`의 액션 버튼 종류. 실측 결과 "고객센터 문의"는 어디에도 없고
 * 전부 "1:1 문의"(`inquiry`)로 통일돼 있다. BE에서 오는 미확정 문자열이 아니라 FE
 * 내부에서만 도는 닫힌 유니온이라 {@link ORDER_STATUS_LABEL}과 같은 이유로
 * {@link ORDER_CARD_ACTION_LABEL}을 그대로 export한다(unknown-safe 방어 불필요).
 */
export type OrderCardActionType =
  | "checkPaymentInfo" // 입금 정보 확인
  | "cancelOrder" // 주문 취소
  | "changeAddress" // 배송지 변경
  | "checkDelivery" // 배송 조회
  | "confirmPurchase" // 구매 확정
  | "writeReview" // 후기 작성
  | "requestExchangeRefund" // 교환 · 환불 신청
  | "addToCart" // 장바구니 담기
  | "buyAgain" // 바로 구매하기
  | "guideReturnAddress" // 상품 회수 주소지 안내
  | "refundInfo" // 환불 정보
  | "inquiry"; // 1:1 문의

export const ORDER_CARD_ACTION_LABEL: Record<OrderCardActionType, string> = {
  checkPaymentInfo: "입금 정보 확인",
  cancelOrder: "주문 취소",
  changeAddress: "배송지 변경",
  checkDelivery: "배송 조회",
  confirmPurchase: "구매 확정",
  writeReview: "후기 작성",
  requestExchangeRefund: "교환 · 환불 신청",
  addToCart: "장바구니 담기",
  buyAgain: "바로 구매하기",
  guideReturnAddress: "상품 회수 주소지 안내",
  refundInfo: "환불 정보",
  inquiry: "1:1 문의",
};

export interface OrderCardActionItem {
  action: OrderCardActionType;
  /** `writeReview` 전용 — "적립금 +100원" 배지 표시(목록 MY-1 실측, T-27). */
  withReward?: boolean;
}

/**
 * 상태 → 액션 버튼 매트릭스(목록 MY-1 기준). `CANCELED`만 예외 — 사유(reason) 유무로
 * 버튼 세트가 갈리는 게 실측으로 확인됐다(소비자 취소: 장바구니 담기·바로 구매하기 /
 * 장인 취소: 1:1 문의만). 나머지 13개 상태는 `hasReason`과 무관하게 고정 매트릭스를
 * 돌려준다.
 *
 * `DELIVERED`의 버튼 순서·배지는 이 목록 화면(MY-1) 실측 기준. 상세 화면(MY-1-OD)은
 * 같은 상태인데도 프레임 자체가 다르게 그려져 있어 {@link getOrderDetailActions}에서
 * 따로 덮어쓴다(문서 불일치가 아니라 화면 인스턴스 자체의 차이 — 두 화면 모두 실측 확인).
 */
export function getOrderCardActions(
  status: OrderStatus,
  hasReason: boolean,
): OrderCardActionItem[] {
  switch (status) {
    case "PAYMENT_PENDING":
      return [
        { action: "checkPaymentInfo" },
        { action: "cancelOrder" },
        { action: "inquiry" },
      ];
    case "ORDER_PENDING":
      return [
        { action: "cancelOrder" },
        { action: "changeAddress" },
        { action: "inquiry" },
      ];
    case "PREPARING":
      return [{ action: "changeAddress" }, { action: "inquiry" }];
    case "SHIPPING":
      return [{ action: "checkDelivery" }, { action: "inquiry" }];
    case "DELIVERED":
      return [
        { action: "confirmPurchase" },
        { action: "writeReview", withReward: true },
        { action: "requestExchangeRefund" },
      ];
    case "PURCHASE_CONFIRMED":
      return [
        { action: "addToCart" },
        { action: "writeReview", withReward: true },
        { action: "buyAgain" },
      ];
    case "CANCELED":
      return hasReason
        ? [{ action: "inquiry" }]
        : [{ action: "addToCart" }, { action: "buyAgain" }];
    case "EXCHANGE_REQUESTED":
    case "EXCHANGE_REJECTED":
    case "REFUND_REQUESTED":
    case "REFUND_REJECTED":
      return [{ action: "inquiry" }];
    case "EXCHANGE_APPROVED":
    case "REFUND_APPROVED":
      return [{ action: "guideReturnAddress" }, { action: "inquiry" }];
    case "REFUND_COMPLETED":
      return [{ action: "refundInfo" }, { action: "inquiry" }];
  }
}

/**
 * 주문 상세 화면(`/mypage/orders/[orderId]`) 전용. `getOrderCardActions`(목록 MY-1 기준)와
 * 다른 점 둘 다 두 화면을 각각 실측해서 확인한 실제 차이다(같은 상태인데 프레임 자체가
 * 다르게 그려져 있음 — 문서 불일치가 아니라 화면 인스턴스 차이):
 *   1. "1:1 문의"가 없는 상태는 상세에서 추가로 붙는다(목록 5개 상태 중 유일하게 상세에서도
 *      확인 가능했던 배송완료 예시에 1:1 문의가 하나 더 붙어 있었다 — design.md §2, T-28).
 *   2. 배송완료만 목록과 순서·배지가 다르다 — 목록은 "후기 작성(+배지) → 교환·환불 신청"
 *      순인데, 상세 인스턴스 5개 모두 "교환·환불 신청 → 후기 작성" 순이고 배지가 없다.
 *      (`PURCHASE_CONFIRMED`는 상세 화면에서 확인 가능한 예시가 없어 목록과 동일하다고
 *      가정한다 — 반례 발견 시 재검토.)
 */
export function getOrderDetailActions(
  status: OrderStatus,
  hasReason: boolean,
): OrderCardActionItem[] {
  const base =
    status === "DELIVERED"
      ? [
          { action: "confirmPurchase" as const },
          { action: "requestExchangeRefund" as const },
          { action: "writeReview" as const },
        ]
      : getOrderCardActions(status, hasReason);
  if (base.some((item) => item.action === "inquiry")) return base;
  return [...base, { action: "inquiry" }];
}

/**
 * MY-1(`/mypage/orders`) "주문 처리 상태" 필터 탭 8종 + "내 주문 현황" 요약 스트립의 그룹 키.
 * Figma 실측 탭 라벨 그대로. `ORDER_PENDING`("주문 확인 중")은 필터 탭에 별도 항목이 없어
 * `PREPARING` 그룹에 합친다 — 확정(design.md §9).
 */
export const ORDER_STATUS_GROUP = {
  PAYMENT_PENDING: ["PAYMENT_PENDING"],
  PREPARING: ["ORDER_PENDING", "PREPARING"],
  SHIPPING: ["SHIPPING"],
  DELIVERED: ["DELIVERED"],
  PURCHASE_CONFIRMED: ["PURCHASE_CONFIRMED"],
  EXCHANGE_REFUND: [
    "EXCHANGE_REQUESTED",
    "EXCHANGE_REJECTED",
    "EXCHANGE_APPROVED",
    "REFUND_REQUESTED",
    "REFUND_REJECTED",
    "REFUND_APPROVED",
    "REFUND_COMPLETED",
  ],
  CANCELED: ["CANCELED"],
} as const satisfies Record<string, OrderStatus[]>;

export type OrderStatusGroupKey = keyof typeof ORDER_STATUS_GROUP;

export const ORDER_STATUS_FILTER_TABS: {
  key: "ALL" | OrderStatusGroupKey;
  label: string;
}[] = [
  { key: "ALL", label: "전체" },
  { key: "PAYMENT_PENDING", label: "입금 확인 중" },
  { key: "PREPARING", label: "상품 준비 중" },
  { key: "SHIPPING", label: "배송 중" },
  { key: "DELIVERED", label: "배송 완료" },
  { key: "PURCHASE_CONFIRMED", label: "구매 확정" },
  { key: "EXCHANGE_REFUND", label: "교환 · 환불" },
  { key: "CANCELED", label: "주문 취소" },
];

/** 요약 스트립 4단계(진행 현황) — `PURCHASE_CONFIRMED`는 Figma대로 제외(확정, design.md §9). */
export const ORDER_STAGE_SUMMARY_KEYS = [
  "PAYMENT_PENDING",
  "PREPARING",
  "SHIPPING",
  "DELIVERED",
] as const satisfies readonly OrderStatusGroupKey[];

/** MY-1 기간 필터 — 프리셋 6종 + 커스텀. */
export const ORDER_PERIOD_PRESET = {
  TODAY: "TODAY",
  WEEK: "WEEK",
  MONTH_1: "MONTH_1",
  MONTH_3: "MONTH_3",
  MONTH_6: "MONTH_6",
  MONTH_12: "MONTH_12",
  CUSTOM: "CUSTOM",
} as const;

export type OrderPeriodPreset =
  (typeof ORDER_PERIOD_PRESET)[keyof typeof ORDER_PERIOD_PRESET];

export const ORDER_PERIOD_PRESET_LABEL: Record<
  Exclude<OrderPeriodPreset, "CUSTOM">,
  string
> = {
  TODAY: "오늘",
  WEEK: "일주일",
  MONTH_1: "1개월",
  MONTH_3: "3개월",
  MONTH_6: "6개월",
  MONTH_12: "12개월",
};

export interface OrderPeriodRange {
  from: string;
  to: string;
}

/**
 * 프리셋 → `{ from, to }` ISO 날짜(`YYYY-MM-DD`). `CUSTOM`은 `custom`을 그대로 돌려준다
 * (없으면 오늘 하루로 폴백). Day.js 최초 실사용처 — 화면 표시 포맷팅(`2026.09.07`)은 호출측이
 * 담당한다(이 함수는 쿼리 파라미터용 ISO 형식만 돌려준다).
 */
export function resolveOrderPeriod(
  preset: OrderPeriodPreset,
  custom?: OrderPeriodRange,
): OrderPeriodRange {
  const today = dayjs();
  const to = today.format("YYYY-MM-DD");
  switch (preset) {
    case "TODAY":
      return { from: to, to };
    case "WEEK":
      return { from: today.subtract(1, "week").format("YYYY-MM-DD"), to };
    case "MONTH_1":
      return { from: today.subtract(1, "month").format("YYYY-MM-DD"), to };
    case "MONTH_3":
      return { from: today.subtract(3, "month").format("YYYY-MM-DD"), to };
    case "MONTH_6":
      return { from: today.subtract(6, "month").format("YYYY-MM-DD"), to };
    case "MONTH_12":
      return { from: today.subtract(12, "month").format("YYYY-MM-DD"), to };
    case "CUSTOM":
      return custom ?? { from: to, to };
  }
}
