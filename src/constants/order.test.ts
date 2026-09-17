import { describe, expect, it } from "vitest";

import { getOrderCardActions, orderStatusLabel } from "./order";

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
