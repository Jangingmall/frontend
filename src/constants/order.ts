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
  | "cancelExchangeRequest" // 교환 신청 취소
  | "cancelRefundRequest" // 환불 신청 취소
  | "changeAddress" // 배송지 변경
  | "checkDelivery" // 배송 조회
  | "confirmPurchase" // 구매 확정
  | "writeReview" // 후기 작성
  | "requestExchangeRefund" // 교환 · 환불 신청
  | "addToCart" // 장바구니 담기
  | "buyAgain" // 바로 구매하기
  | "guideReturnAddress" // 상품 회수 안내
  | "refundInfo" // 환불 정보
  | "inquiry"; // 1:1 문의

export const ORDER_CARD_ACTION_LABEL: Record<OrderCardActionType, string> = {
  checkPaymentInfo: "입금 정보 확인",
  cancelOrder: "주문 취소",
  cancelExchangeRequest: "교환 신청 취소",
  cancelRefundRequest: "환불 신청 취소",
  changeAddress: "배송지 변경",
  checkDelivery: "배송 조회",
  confirmPurchase: "구매 확정",
  writeReview: "후기 작성",
  requestExchangeRefund: "교환 · 환불 신청",
  addToCart: "장바구니 담기",
  buyAgain: "바로 구매하기",
  guideReturnAddress: "상품 회수 안내",
  refundInfo: "환불 정보",
  inquiry: "1:1 문의",
};

/**
 * 주문 상세 화면(MY-1-OD)만 목록과 문구가 다른 것들 — Figma 실측(`1718:16488`) 결과
 * "하기"를 붙인 동사형이다(목록은 명사형). `addToCart`만 예외로 동사형이 아니라
 * 완전히 다른 표현("장바구니에 넣기")을 쓴다(주문취소·구매확정 목업 모두 동일).
 * 상세 전용 버튼(`cancelExchangeRequest` 등)은 목록에 아예 없어 위 공용 라벨을
 * 그대로 쓴다.
 */
export const ORDER_DETAIL_ACTION_LABEL: Partial<
  Record<OrderCardActionType, string>
> = {
  cancelOrder: "주문 취소하기",
  addToCart: "장바구니에 넣기",
  inquiry: "1:1 문의하기",
};

export interface OrderCardActionItem {
  action: OrderCardActionType;
  /** `writeReview` 전용 — "적립금 +100원" 배지 표시(목록 MY-1 실측, T-27). */
  withReward?: boolean;
  /**
   * 주문 상세 전용 — 버튼 스타일(목록은 항상 solid라 안 씀). Figma 실측(`1718:16488`)
   * 결과 상태마다 "대표 액션" 하나만 solid(단독 한 줄)이고 나머지는 outline(그 아래
   * 한 줄에 균등폭)이다 — 대표 액션이 없는 상태는 전부 outline. 생략하면 outline.
   */
  style?: "solid" | "outline";
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
  /**
   * "입금 정보 확인" 버튼 노출 조건(Figma 스펙시트 `2080:112091` 실측) — 실시간
   * 계좌이체·무통장입금일 때만 보인다. 목록 화면(MY-1)은 결제 수단 자체를 안 받아서
   * (BE 미제공, be-requests.md #3) 인자를 안 넘기면(`undefined`) 필터 없이 항상
   * 노출한다(T-27 때부터의 기존 동작 유지) — 상세 화면(MY-1-OD)만 실제 값을 넘겨
   * 필터링한다.
   */
  paymentMethod?: string | null,
): OrderCardActionItem[] {
  switch (status) {
    case "PAYMENT_PENDING": {
      const actions: OrderCardActionItem[] = [
        { action: "checkPaymentInfo" },
        { action: "cancelOrder" },
        { action: "inquiry" },
      ];
      if (paymentMethod === undefined) return actions;
      const isTransferPayment =
        paymentMethod === "REALTIME_TRANSFER" ||
        paymentMethod === "BANK_TRANSFER";
      return isTransferPayment
        ? actions
        : actions.filter((item) => item.action !== "checkPaymentInfo");
    }
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
 * 주문 상세 화면(`/mypage/orders/[orderId]`) 전용 매트릭스. 목록(`getOrderCardActions`)과
 * 공유하지 않는다 — Figma 실측(`1718:16488`, "상태별 설명") 결과 상세 화면은 목록과 버튼
 * 구성·순서·스타일이 상태마다 다르게 설계돼 있다(같은 상태여도 별개 화면 인스턴스).
 * 상태별 "대표 액션"(있으면 solid 단독 한 줄) + 나머지(outline, 균등폭 한 줄) 구조이고,
 * "1:1 문의"가 없는 조합엔 항상 자동으로 붙는다("클릭 시 문의하기 모달 활성화" 콜아웃이
 * 거의 모든 상태에 반복 등장 — 상세 화면 공통 기본 액션으로 취급).
 *
 * `PAYMENT_PENDING`/`ORDER_PENDING`은 대표 액션(주문취소하기) 뒤에 "장바구니 담기·바로
 * 구매하기"가 그대로 실측된다(사용자 확인, T-28) — 기다리지 않고 같은 상품을 바로 다시
 * 살 수 있게 하는 상세 화면 전용 숏컷으로 보인다. `PAYMENT_PENDING`의 "입금 정보 확인"은
 * 이 두 버튼과 별개로 결제 수단 조건(실시간계좌이체/무통장입금)에 따라 추가된다.
 *
 * `CANCELED`(사유 없음, 소비자 취소)·`REFUND_COMPLETED`는 이 실측 자료에 예시가 없어
 * 목록 매트릭스 + "1:1 문의" 자동 추가로 대체한다(다른 상태들과 같은 보수적 기본값).
 */
export function getOrderDetailActions(
  status: OrderStatus,
  hasReason: boolean,
  paymentMethod?: string | null,
): OrderCardActionItem[] {
  const outline = (
    action: OrderCardActionType,
    withReward?: boolean,
  ): OrderCardActionItem => ({ action, style: "outline", withReward });
  const solid = (action: OrderCardActionType): OrderCardActionItem => ({
    action,
    style: "solid",
  });
  const withInquiry = (actions: OrderCardActionItem[]) =>
    actions.some((item) => item.action === "inquiry")
      ? actions
      : [...actions, outline("inquiry")];

  switch (status) {
    case "PAYMENT_PENDING": {
      const isTransferPayment =
        paymentMethod === "REALTIME_TRANSFER" ||
        paymentMethod === "BANK_TRANSFER";
      const checkPaymentInfoActions =
        paymentMethod === undefined || isTransferPayment
          ? [outline("checkPaymentInfo")]
          : [];
      return withInquiry([
        solid("cancelOrder"),
        ...checkPaymentInfoActions,
        outline("addToCart"),
        outline("buyAgain"),
      ]);
    }
    case "ORDER_PENDING":
      return withInquiry([
        solid("cancelOrder"),
        outline("addToCart"),
        outline("buyAgain"),
      ]);
    case "PREPARING":
      return withInquiry([]);
    case "SHIPPING":
      return withInquiry([solid("checkDelivery")]);
    case "DELIVERED":
      return withInquiry([
        solid("confirmPurchase"),
        outline("requestExchangeRefund"),
        outline("writeReview"),
      ]);
    case "PURCHASE_CONFIRMED":
      return withInquiry([
        solid("writeReview"),
        outline("addToCart"),
        outline("buyAgain"),
      ]);
    case "CANCELED":
      // 실측(`1725:43684`)엔 소비자 취소("단순 변심") 예시도 사유 배너가 있어서,
      // `hasReason`은 "장인 취소냐 소비자 취소냐"의 완벽한 대리 신호는 아니다 — 다만
      // BE가 `reason` 자체를 아직 안 줘서(계약에 없음, types/order.ts 참고) 더 정확한
      // 신호(취소 주체 필드 등)가 생기기 전까진 T-27부터 써온 이 근사값을 유지한다.
      return hasReason
        ? withInquiry([])
        : withInquiry(
            getOrderCardActions(status, hasReason).map((item) => ({
              ...item,
              style: "outline" as const,
            })),
          );
    case "EXCHANGE_REQUESTED":
      return withInquiry([
        outline("cancelExchangeRequest"),
        outline("checkDelivery"),
      ]);
    case "EXCHANGE_APPROVED":
      return withInquiry([
        solid("guideReturnAddress"),
        outline("cancelExchangeRequest"),
        outline("checkDelivery"),
      ]);
    case "EXCHANGE_REJECTED":
      return withInquiry([]);
    case "REFUND_REQUESTED":
      return withInquiry([
        outline("cancelRefundRequest"),
        outline("checkDelivery"),
      ]);
    case "REFUND_APPROVED":
      return withInquiry([
        solid("guideReturnAddress"),
        outline("cancelRefundRequest"),
        outline("checkDelivery"),
      ]);
    case "REFUND_REJECTED":
      return withInquiry([]);
    case "REFUND_COMPLETED":
      return withInquiry(
        getOrderCardActions(status, hasReason).map((item) => ({
          ...item,
          style: "outline" as const,
        })),
      );
  }
}

/**
 * 사유 배너 라벨(`{라벨} 사유 :`) — 대부분 {@link ORDER_STATUS_LABEL}과 같지만
 * "신청" 상태 둘만 실측(`1718:16488`) 결과 접미사를 뗀 축약형이었다("교환 신청 사유"가
 * 아니라 "교환 사유", "환불 신청 사유"가 아니라 "환불 사유").
 */
export function getOrderDetailReasonLabel(status: OrderStatus): string {
  switch (status) {
    case "EXCHANGE_REQUESTED":
      return "교환";
    case "REFUND_REQUESTED":
      return "환불";
    default:
      return ORDER_STATUS_LABEL[status];
  }
}

/**
 * 주문 상세 화면의 "주문 유의사항" — 실측(`1718:16488`) 결과 고정 문구가 아니라 상태마다
 * 다른 안내다. 이미 사유 배너를 보여주는 상태(교환·환불 불가, 주문취소-사유있음)와
 * 근거 화면이 없는 상태(구매확정 이후의 취소·환불 완료류)는 `undefined`(박스 자체를
 * 안 그림). "NN시간"·"약 N주"는 Figma 목업에도 숫자가 채워지지 않은 자리표시자 그대로
 * 다 — 실제 값은 비즈니스 확정 후 채워야 한다(be-requests.md 후보).
 */
export function getOrderDetailNoticeLines(
  status: OrderStatus,
): string[] | undefined {
  switch (status) {
    case "PAYMENT_PENDING":
      return [
        "입금 확인은 평일 기준 NN시간 이내 처리됩니다.",
        "입금 확인 전 취소 시 결제 금액이 자동 환불됩니다.",
      ];
    case "ORDER_PENDING":
      return [
        "판매자가 주문을 확인한 후 제작이 시작됩니다.",
        "제작 시작 후 주문 취소가 어렵습니다.",
        "제작 완료 후 판매자가 직접 배송합니다. (약 N주 소요)",
      ];
    case "PREPARING":
      return [
        "현재 제작 중으로 주문 취소가 불가합니다.",
        "제작 완료 후 판매자가 직접 배송합니다. (약 N주 소요)",
      ];
    case "SHIPPING":
      return [
        "판매자가 직접 배송하여 배송 조회가 늦게 업데이트될 수 있습니다.",
        "택배사 사정에 따라 배송이 지연될 수 있습니다.",
      ];
    case "DELIVERED":
      return [
        "교환·환불은 배송 완료일 기준 7일 이내 신청 가능합니다.",
        "주문제작 상품은 단순 변심에 의한 교환·환불이 불가합니다.",
        "단순 변심 교환·환불 시 왕복 배송비가 청구됩니다.",
      ];
    case "PURCHASE_CONFIRMED":
      return ["구매 확정 후에는 교환·환불 신청이 불가합니다."];
    case "EXCHANGE_REQUESTED":
    case "EXCHANGE_APPROVED":
    case "REFUND_REQUESTED":
    case "REFUND_APPROVED":
      return [
        "단순 변심에 의한 교환·환불 시 왕복 배송비가 청구됩니다.",
        "주문제작 상품의 경우 단순 변심에 의한 교환·환불 요청은 거절될 수 있습니다.",
      ];
    case "CANCELED":
    case "EXCHANGE_REJECTED":
    case "REFUND_REJECTED":
    case "REFUND_COMPLETED":
      return undefined;
  }
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
