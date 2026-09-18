import { describe, expect, it } from "vitest";

import { orderListResponseDto, orderStatusSummaryDto } from "./validation";

describe("orderListResponseDto", () => {
  const validItem = {
    orderItemId: 10,
    productId: 1,
    productName: "백자 달항아리",
    price: 320000,
    quantity: 1,
    thumbnail: [{ url: "https://cdn.midam.store/products/abc.jpg" }],
  };

  function listWith(order: Record<string, unknown>) {
    return {
      content: [
        {
          orderId: 1,
          orderNumber: "ORD20260101001",
          status: "DELIVERED",
          totalAmount: 320000,
          createdAt: "2026-09-01T00:00:00.000Z",
          items: [validItem],
          ...order,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };
  }

  it("올바른 응답(Spring Pageable, 계약서 §3-1)을 검증한다", () => {
    expect(() => orderListResponseDto.parse(listWith({}))).not.toThrow();
  });

  it("thumbnail이 빈 배열이어도 통과한다(이미지 없는 상품)", () => {
    expect(() =>
      orderListResponseDto.parse(
        listWith({ items: [{ ...validItem, thumbnail: [] }] }),
      ),
    ).not.toThrow();
  });

  it("returnInfo를 포함한 응답을 검증한다(계약서 §4)", () => {
    expect(() =>
      orderListResponseDto.parse(
        listWith({
          status: "RETURN_REQUESTED",
          returnInfo: { type: "EXCHANGE", status: "REQUESTED" },
        }),
      ),
    ).not.toThrow();
  });

  it("알 수 없는 상태값은 거부한다", () => {
    expect(() =>
      orderListResponseDto.parse(listWith({ status: "UNKNOWN_STATUS" })),
    ).toThrow();
  });

  it("아이템이 없는 주문은 거부한다", () => {
    expect(() => orderListResponseDto.parse(listWith({ items: [] }))).toThrow();
  });
});

describe("orderStatusSummaryDto", () => {
  it("inProgress/closedCount 중첩 구조를 검증한다(계약서 §3-3)", () => {
    const dto = {
      inProgress: {
        awaitingPayment: 1,
        preparing: 2,
        inDelivery: 0,
        delivered: 3,
      },
      closedCount: {
        returnOrExchange: 0,
        canceled: 1,
      },
    };
    expect(orderStatusSummaryDto.parse(dto)).toEqual(dto);
  });
});
