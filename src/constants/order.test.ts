import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOrderCardActions,
  getOrderDetailActions,
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
  it("입금확인중 상태의 버튼 순서를 반환한다", () => {
    expect(getOrderCardActions("PAYMENT_PENDING", false)).toEqual([
      { action: "checkPaymentInfo" },
      { action: "cancelOrder" },
      { action: "inquiry" },
    ]);
  });

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
  it("배송완료는 목록과 달리 순서가 다르고 적립금 배지가 없다(상세 화면 실측)", () => {
    expect(getOrderDetailActions("DELIVERED", false)).toEqual([
      { action: "confirmPurchase" },
      { action: "requestExchangeRefund" },
      { action: "writeReview" },
      { action: "inquiry" },
    ]);
  });

  it("목록에 이미 1:1 문의가 있는 상태는 중복으로 추가하지 않는다", () => {
    expect(getOrderDetailActions("PAYMENT_PENDING", false)).toEqual(
      getOrderCardActions("PAYMENT_PENDING", false),
    );
  });

  it("배송완료 외 상태는 목록과 동일한 매트릭스에 1:1 문의만 추가한다", () => {
    expect(getOrderDetailActions("CANCELED", false)).toEqual([
      ...getOrderCardActions("CANCELED", false),
      { action: "inquiry" },
    ]);
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
