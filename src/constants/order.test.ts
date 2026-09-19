import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOrderCardActions,
  getOrderDetailActions,
  getOrderDetailNoticeLines,
  getOrderDetailReasonLabel,
  getOrderDetailReasonSuffix,
  ORDER_DETAIL_IMPLEMENTED_ACTIONS,
  ORDER_STATUS,
  ORDER_STATUS_FILTER_TABS,
  ORDER_STATUS_GROUP,
  orderStatusLabel,
  resolveOrderPeriod,
} from "./order";

describe("orderStatusLabel", () => {
  it("알려진 상태값을 라벨로 변환한다", () => {
    expect(orderStatusLabel("DELIVERED")).toBe("배송 완료");
  });

  it("모르는 값이면 undefined를 돌려준다", () => {
    expect(orderStatusLabel("UNKNOWN")).toBeUndefined();
    expect(orderStatusLabel(null)).toBeUndefined();
    expect(orderStatusLabel(undefined)).toBeUndefined();
  });
});

describe("getOrderCardActions", () => {
  it("입금확인중 상태의 버튼 순서를 반환한다(결제 수단 모름 → 필터 없이 노출)", () => {
    expect(getOrderCardActions("PAYMENT_PENDING", false)).toEqual([
      { action: "checkPaymentInfo" },
      { action: "cancelOrder" },
      { action: "inquiry" },
    ]);
  });

  it.each(["REALTIME_TRANSFER", "BANK_TRANSFER"] as const)(
    "결제 수단이 %s면 입금 정보 확인 버튼을 보여준다(Figma 스펙시트 2080:112091)",
    (paymentMethod) => {
      expect(
        getOrderCardActions("PAYMENT_PENDING", false, paymentMethod),
      ).toEqual([
        { action: "checkPaymentInfo" },
        { action: "cancelOrder" },
        { action: "inquiry" },
      ]);
    },
  );

  it.each(["CARD", "TOSS_PAY", null] as const)(
    "결제 수단이 %s면 입금 정보 확인 버튼을 숨긴다",
    (paymentMethod) => {
      expect(
        getOrderCardActions("PAYMENT_PENDING", false, paymentMethod),
      ).toEqual([{ action: "cancelOrder" }, { action: "inquiry" }]);
    },
  );

  it("주문확인중 상태의 버튼 순서를 반환한다", () => {
    expect(getOrderCardActions("ORDER_PENDING", false)).toEqual([
      { action: "cancelOrder" },
      { action: "changeAddress" },
      { action: "inquiry" },
    ]);
  });

  it("상품준비중 상태의 버튼 순서를 반환한다", () => {
    expect(getOrderCardActions("PREPARING", false)).toEqual([
      { action: "changeAddress" },
      { action: "inquiry" },
    ]);
  });

  it("배송중 상태의 버튼 순서를 반환한다", () => {
    expect(getOrderCardActions("SHIPPING", false)).toEqual([
      { action: "checkDelivery" },
      { action: "inquiry" },
    ]);
  });

  it("배송완료 상태는 후기 작성에 적립금 배지가 붙는다", () => {
    expect(getOrderCardActions("DELIVERED", false)).toEqual([
      { action: "confirmPurchase" },
      { action: "writeReview", withReward: true },
      { action: "requestExchangeRefund" },
    ]);
  });

  it("구매확정 상태는 후기 작성에 적립금 배지가 붙는다", () => {
    expect(getOrderCardActions("PURCHASE_CONFIRMED", false)).toEqual([
      { action: "addToCart" },
      { action: "writeReview", withReward: true },
      { action: "buyAgain" },
    ]);
  });

  it("주문취소 상태는 사유가 없으면 장바구니 담기·바로 구매하기를 보여준다", () => {
    expect(getOrderCardActions("CANCELED", false)).toEqual([
      { action: "addToCart" },
      { action: "buyAgain" },
    ]);
  });

  it("주문취소 상태는 사유가 있으면 1:1 문의만 보여준다", () => {
    expect(getOrderCardActions("CANCELED", true)).toEqual([
      { action: "inquiry" },
    ]);
  });

  it.each([
    "EXCHANGE_REQUESTED",
    "EXCHANGE_REJECTED",
    "REFUND_REQUESTED",
    "REFUND_REJECTED",
  ] as const)("%s 상태는 1:1 문의만 보여준다 (hasReason 무관)", (status) => {
    expect(getOrderCardActions(status, false)).toEqual([{ action: "inquiry" }]);
    expect(getOrderCardActions(status, true)).toEqual([{ action: "inquiry" }]);
  });

  it.each(["EXCHANGE_APPROVED", "REFUND_APPROVED"] as const)(
    "%s 상태는 상품 회수 주소지 안내 · 1:1 문의를 보여준다",
    (status) => {
      expect(getOrderCardActions(status, false)).toEqual([
        { action: "guideReturnAddress" },
        { action: "inquiry" },
      ]);
    },
  );

  it("환불완료 상태는 환불 정보 · 1:1 문의를 보여준다", () => {
    expect(getOrderCardActions("REFUND_COMPLETED", false)).toEqual([
      { action: "refundInfo" },
      { action: "inquiry" },
    ]);
  });
});

describe("getOrderDetailActions", () => {
  // Figma "상태별 설명"(1718:16488) 실측 — 목록(getOrderCardActions)과 완전히
  // 별개 매트릭스. 대표 액션이 있으면 style: "solid" 단독, 나머지는 "outline".

  it("입금확인중 — 대표(주문취소), 결제수단 모르면 입금정보확인도 노출", () => {
    expect(getOrderDetailActions("PAYMENT_PENDING", false)).toEqual([
      { action: "cancelOrder", style: "solid" },
      { action: "checkPaymentInfo", style: "outline" },
      { action: "addToCart", style: "outline" },
      { action: "buyAgain", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("입금확인중 + 카드 결제면 입금정보확인 없이 나머지만", () => {
    expect(getOrderDetailActions("PAYMENT_PENDING", false, "CARD")).toEqual([
      { action: "cancelOrder", style: "solid" },
      { action: "addToCart", style: "outline" },
      { action: "buyAgain", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("주문확인중 — 대표(주문취소) + 장바구니 담기 + 바로 구매하기 + 1:1 문의", () => {
    expect(getOrderDetailActions("ORDER_PENDING", false)).toEqual([
      { action: "cancelOrder", style: "solid" },
      { action: "addToCart", style: "outline" },
      { action: "buyAgain", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("상품준비중 — 대표 없이 1:1 문의만(배송지 변경은 패널 버튼이 담당)", () => {
    expect(getOrderDetailActions("PREPARING", false)).toEqual([
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("배송중 — 대표(배송조회) + 1:1 문의", () => {
    expect(getOrderDetailActions("SHIPPING", false)).toEqual([
      { action: "checkDelivery", style: "solid" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("배송완료 — 대표(구매확정) → 교환·환불 신청 → 후기 작성 → 1:1 문의", () => {
    expect(getOrderDetailActions("DELIVERED", false)).toEqual([
      { action: "confirmPurchase", style: "solid" },
      { action: "requestExchangeRefund", style: "outline" },
      { action: "writeReview", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("구매확정 — 대표(후기작성) → 장바구니 담기 → 바로 구매하기 → 1:1 문의", () => {
    expect(getOrderDetailActions("PURCHASE_CONFIRMED", false)).toEqual([
      { action: "writeReview", style: "solid" },
      { action: "addToCart", style: "outline" },
      { action: "buyAgain", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("주문취소 — cancelInitiator 없이 사유 있으면(근사) 1:1 문의만", () => {
    expect(getOrderDetailActions("CANCELED", true)).toEqual([
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("주문취소 — cancelInitiator 없이 사유 없으면(근사) 목록 매트릭스 + 1:1 문의, 전부 outline", () => {
    expect(getOrderDetailActions("CANCELED", false)).toEqual([
      { action: "addToCart", style: "outline" },
      { action: "buyAgain", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("주문취소 — 사유가 있어도 소비자 취소(단순 변심)면 장바구니에 넣기 등을 보여준다(Figma 1725:43684)", () => {
    expect(
      getOrderDetailActions("CANCELED", true, undefined, "consumer"),
    ).toEqual([
      { action: "addToCart", style: "outline" },
      { action: "buyAgain", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("주문취소 — 사유가 없어도 장인 거절이면 1:1 문의만 보여준다", () => {
    expect(
      getOrderDetailActions("CANCELED", false, undefined, "artisan"),
    ).toEqual([{ action: "inquiry", style: "outline" }]);
  });

  it("교환신청 — 대표 없이 교환신청취소·배송조회·1:1문의", () => {
    expect(getOrderDetailActions("EXCHANGE_REQUESTED", true)).toEqual([
      { action: "cancelExchangeRequest", style: "outline" },
      { action: "checkDelivery", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("교환승인 — 대표(상품회수안내) → 교환신청취소 → 배송조회 → 1:1문의", () => {
    expect(getOrderDetailActions("EXCHANGE_APPROVED", false)).toEqual([
      { action: "guideReturnAddress", style: "solid" },
      { action: "cancelExchangeRequest", style: "outline" },
      { action: "checkDelivery", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("교환불가 — 대표 없이 1:1 문의만", () => {
    expect(getOrderDetailActions("EXCHANGE_REJECTED", true)).toEqual([
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("환불신청 — 대표 없이 환불신청취소·배송조회·1:1문의", () => {
    expect(getOrderDetailActions("REFUND_REQUESTED", true)).toEqual([
      { action: "cancelRefundRequest", style: "outline" },
      { action: "checkDelivery", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("환불승인 — 대표(상품회수안내) → 환불신청취소 → 배송조회 → 1:1문의", () => {
    expect(getOrderDetailActions("REFUND_APPROVED", false)).toEqual([
      { action: "guideReturnAddress", style: "solid" },
      { action: "cancelRefundRequest", style: "outline" },
      { action: "checkDelivery", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("환불불가 — 대표 없이 1:1 문의만", () => {
    expect(getOrderDetailActions("REFUND_REJECTED", true)).toEqual([
      { action: "inquiry", style: "outline" },
    ]);
  });

  it("환불완료 — 실측 예시가 없어 목록 매트릭스 + 1:1 문의, 전부 outline", () => {
    expect(getOrderDetailActions("REFUND_COMPLETED", false)).toEqual([
      { action: "refundInfo", style: "outline" },
      { action: "inquiry", style: "outline" },
    ]);
  });
});

describe("getOrderDetailReasonLabel", () => {
  it("교환 신청·환불 신청은 '신청'을 뗀 축약형 + 콜론 앞 공백 없이 돌려준다(Figma 1718:16488)", () => {
    expect(getOrderDetailReasonLabel("EXCHANGE_REQUESTED")).toBe("교환 사유:");
    expect(getOrderDetailReasonLabel("REFUND_REQUESTED")).toBe("환불 사유:");
  });

  it("주문취소는 전체 라벨 + 콜론 앞 공백 없이 돌려준다", () => {
    expect(getOrderDetailReasonLabel("CANCELED")).toBe("주문 취소 사유:");
  });

  it("교환·환불 불가는 전체 라벨 + 콜론 앞 공백 있게 돌려준다", () => {
    expect(getOrderDetailReasonLabel("EXCHANGE_REJECTED")).toBe(
      "교환 불가 사유 :",
    );
    expect(getOrderDetailReasonLabel("REFUND_REJECTED")).toBe(
      "환불 불가 사유 :",
    );
  });
});

describe("getOrderDetailReasonSuffix", () => {
  it("교환 신청·환불 신청만 '(승인 대기 중)' 접미사를 돌려준다", () => {
    expect(getOrderDetailReasonSuffix("EXCHANGE_REQUESTED")).toBe(
      "(승인 대기 중)",
    );
    expect(getOrderDetailReasonSuffix("REFUND_REQUESTED")).toBe(
      "(승인 대기 중)",
    );
  });

  it("그 외 상태는 undefined를 돌려준다", () => {
    expect(getOrderDetailReasonSuffix("CANCELED")).toBeUndefined();
    expect(getOrderDetailReasonSuffix("EXCHANGE_REJECTED")).toBeUndefined();
  });
});

describe("getOrderDetailNoticeLines", () => {
  it("상태마다 다른 안내 문구를 돌려준다", () => {
    expect(getOrderDetailNoticeLines("PAYMENT_PENDING")).toEqual([
      "입금 확인은 평일 기준 NN시간 이내 처리됩니다.",
      "입금 확인 전 취소 시 결제 금액이 자동 환불됩니다.",
    ]);
    expect(getOrderDetailNoticeLines("PURCHASE_CONFIRMED")).toEqual([
      "구매 확정 후에는 교환·환불 신청이 불가합니다.",
    ]);
  });

  it.each([
    "CANCELED",
    "EXCHANGE_REJECTED",
    "REFUND_REJECTED",
    "REFUND_COMPLETED",
  ] as const)("%s는 안내 박스를 생략한다(undefined)", (status) => {
    expect(getOrderDetailNoticeLines(status)).toBeUndefined();
  });
});

describe("ORDER_DETAIL_IMPLEMENTED_ACTIONS", () => {
  it("실제로 연결된 액션(주문취소·구매확정·배송조회)만 포함한다(독립 리뷰 F2)", () => {
    expect(ORDER_DETAIL_IMPLEMENTED_ACTIONS.has("cancelOrder")).toBe(true);
    expect(ORDER_DETAIL_IMPLEMENTED_ACTIONS.has("confirmPurchase")).toBe(true);
    expect(ORDER_DETAIL_IMPLEMENTED_ACTIONS.has("checkDelivery")).toBe(true);
  });

  it("아직 연결 안 된 액션은 포함하지 않는다", () => {
    expect(ORDER_DETAIL_IMPLEMENTED_ACTIONS.has("inquiry")).toBe(false);
    expect(ORDER_DETAIL_IMPLEMENTED_ACTIONS.has("addToCart")).toBe(false);
    expect(ORDER_DETAIL_IMPLEMENTED_ACTIONS.has("writeReview")).toBe(false);
  });
});

describe("ORDER_STATUS_GROUP", () => {
  it("14개 상태값이 정확히 한 그룹에만 속한다", () => {
    const grouped = Object.values(ORDER_STATUS_GROUP).flat();
    expect(grouped.sort()).toEqual(Object.values(ORDER_STATUS).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("필터 탭 순서가 Figma 실측(전체 포함 8종)과 일치한다", () => {
    expect(ORDER_STATUS_FILTER_TABS.map((tab) => tab.label)).toEqual([
      "전체",
      "입금 확인 중",
      "상품 준비 중",
      "배송 중",
      "배송 완료",
      "구매 확정",
      "교환 · 환불",
      "주문 취소",
    ]);
  });
});

describe("resolveOrderPeriod", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-18T00:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘은 오늘 하루만 반환한다", () => {
    expect(resolveOrderPeriod("TODAY")).toEqual({
      from: "2026-09-18",
      to: "2026-09-18",
    });
  });

  it("3개월은 오늘부터 3개월 전까지 반환한다", () => {
    expect(resolveOrderPeriod("MONTH_3")).toEqual({
      from: "2026-06-18",
      to: "2026-09-18",
    });
  });

  it("커스텀은 넘겨준 범위를 그대로 반환한다", () => {
    expect(
      resolveOrderPeriod("CUSTOM", { from: "2026-01-01", to: "2026-01-31" }),
    ).toEqual({ from: "2026-01-01", to: "2026-01-31" });
  });

  it("커스텀인데 범위가 없으면 오늘 하루로 폴백한다", () => {
    expect(resolveOrderPeriod("CUSTOM")).toEqual({
      from: "2026-09-18",
      to: "2026-09-18",
    });
  });
});
