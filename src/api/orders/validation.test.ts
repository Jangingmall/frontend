import { describe, expect, it } from "vitest";

import { seedImageRef } from "@/mocks/seed";

import { orderListResponseDto, orderStatusSummaryDto } from "./validation";

describe("orderListResponseDto", () => {
  const validItem = {
    productId: 1,
    thumbnail: seedImageRef(1),
    productName: "백자 달항아리",
    price: 320000,
    status: "DELIVERED",
    artisanName: "김도예",
  };

  it("올바른 응답을 검증한다", () => {
    expect(() =>
      orderListResponseDto.parse({
        items: [
          {
            orderId: 1,
            orderNumber: "JJ000001",
            orderedAt: "2026-09-01T00:00:00.000Z",
            items: [validItem],
          },
        ],
        totalCount: 1,
      }),
    ).not.toThrow();
  });

  it("알 수 없는 상태값은 거부한다(목업 전용 엄격 검증, design.md §5.3)", () => {
    expect(() =>
      orderListResponseDto.parse({
        items: [
          {
            orderId: 1,
            orderNumber: "JJ000001",
            orderedAt: "2026-09-01T00:00:00.000Z",
            items: [{ ...validItem, status: "UNKNOWN_STATUS" }],
          },
        ],
        totalCount: 1,
      }),
    ).toThrow();
  });

  it("아이템이 없는 주문은 거부한다", () => {
    expect(() =>
      orderListResponseDto.parse({
        items: [
          {
            orderId: 1,
            orderNumber: "JJ000001",
            orderedAt: "2026-09-01T00:00:00.000Z",
            items: [],
          },
        ],
        totalCount: 1,
      }),
    ).toThrow();
  });
});

describe("orderStatusSummaryDto", () => {
  it("6개 카운트 필드를 검증한다", () => {
    expect(
      orderStatusSummaryDto.parse({
        paymentPending: 1,
        preparing: 2,
        shipping: 0,
        delivered: 3,
        exchangeRefund: 0,
        canceled: 1,
      }),
    ).toEqual({
      paymentPending: 1,
      preparing: 2,
      shipping: 0,
      delivered: 3,
      exchangeRefund: 0,
      canceled: 1,
    });
  });
});
