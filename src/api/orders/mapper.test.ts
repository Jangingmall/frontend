import { describe, expect, it } from "vitest";

import { mapOrderListPage, mapOrderStatusSummary } from "./mapper";
import { orderListResponseDto, orderStatusSummaryDto } from "./validation";

function orderDto(overrides: Record<string, unknown> = {}) {
  return {
    orderId: 1,
    orderNumber: "ORD00000000001",
    status: "DELIVERED",
    totalAmount: 320000,
    createdAt: "2026-09-01T00:00:00.000Z",
    items: [
      {
        orderItemId: 10,
        productId: 100,
        productName: "백자 달항아리",
        price: 320000,
        quantity: 1,
        thumbnail: [{ url: "https://cdn.midam.store/products/abc.jpg" }],
      },
    ],
    ...overrides,
  };
}

function parseList(content: ReturnType<typeof orderDto>[], overrides = {}) {
  return orderListResponseDto.parse({
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
    ...overrides,
  });
}

describe("mapOrderListPage — BE 원본 상태 → FE 14종 매핑(계약서 §4)", () => {
  it("CREATED → PAYMENT_PENDING, 아이템에 동일하게 복제된다", () => {
    const page = mapOrderListPage(parseList([orderDto({ status: "CREATED" })]));
    expect(page.items[0]!.items[0]!.status).toBe("PAYMENT_PENDING");
  });

  it("PAID → PREPARING", () => {
    const page = mapOrderListPage(parseList([orderDto({ status: "PAID" })]));
    expect(page.items[0]!.items[0]!.status).toBe("PREPARING");
  });

  it("thumbnail 배열의 첫 URL을 꺼내고, 빈 배열이면 null(CodeRabbit 리뷰)", () => {
    const page = mapOrderListPage(
      parseList([
        orderDto({
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "A",
              price: 1000,
              quantity: 1,
              thumbnail: [{ url: "https://cdn.midam.store/products/1.jpg" }],
            },
            {
              orderItemId: 2,
              productId: 2,
              productName: "B",
              price: 2000,
              quantity: 1,
              thumbnail: [],
            },
          ],
        }),
      ]),
    );
    const items = page.items[0]!.items;
    expect(items[0]!.thumbnailUrl).toBe(
      "https://cdn.midam.store/products/1.jpg",
    );
    expect(items[1]!.thumbnailUrl).toBeNull();
  });

  it("IN_DELIVERY → SHIPPING", () => {
    const page = mapOrderListPage(
      parseList([orderDto({ status: "IN_DELIVERY" })]),
    );
    expect(page.items[0]!.items[0]!.status).toBe("SHIPPING");
  });

  it("다중 상품 주문은 모든 아이템이 주문 전체 상태를 공유한다", () => {
    const page = mapOrderListPage(
      parseList([
        orderDto({
          status: "DELIVERED",
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "A",
              price: 1000,
              quantity: 1,
              thumbnail: [],
            },
            {
              orderItemId: 2,
              productId: 2,
              productName: "B",
              price: 2000,
              quantity: 2,
              thumbnail: [],
            },
          ],
        }),
      ]),
    );
    const items = page.items[0]!.items;
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.status === "DELIVERED")).toBe(true);
  });

  it.each([
    [{ type: "EXCHANGE", status: "REQUESTED" }, "EXCHANGE_REQUESTED"],
    [{ type: "EXCHANGE", status: "REJECTED" }, "EXCHANGE_REJECTED"],
    [{ type: "EXCHANGE", status: "APPROVED" }, "EXCHANGE_APPROVED"],
    [{ type: "RETURN", status: "REQUESTED" }, "REFUND_REQUESTED"],
    [{ type: "RETURN", status: "REJECTED" }, "REFUND_REJECTED"],
    [{ type: "RETURN", status: "APPROVED" }, "REFUND_APPROVED"],
    [{ type: "RETURN", status: "COMPLETED" }, "REFUND_COMPLETED"],
  ] as const)(
    "RETURN_REQUESTED + returnInfo %o → %s (계약서 §4 표 그대로)",
    (returnInfo, expected) => {
      const page = mapOrderListPage(
        parseList([orderDto({ status: "RETURN_REQUESTED", returnInfo })]),
      );
      expect(page.items[0]!.items[0]!.status).toBe(expected);
    },
  );

  it("EXCHANGE + COMPLETED(계약서 §4에 없는 조합)는 주문을 걸러낸다", () => {
    const page = mapOrderListPage(
      parseList([
        orderDto({
          status: "RETURN_REQUESTED",
          returnInfo: { type: "EXCHANGE", status: "COMPLETED" },
        }),
      ]),
    );
    expect(page.items).toHaveLength(0);
  });

  it("returnInfo 없는 RETURN_REQUESTED는 방어적으로 걸러낸다", () => {
    const page = mapOrderListPage(
      parseList([orderDto({ status: "RETURN_REQUESTED" })]),
    );
    expect(page.items).toHaveLength(0);
  });

  it("PAYMENT_FAILED 주문은 목록에서 제외한다(2026-09-18 확인)", () => {
    const page = mapOrderListPage(
      parseList([
        orderDto({ orderId: 1, status: "PAYMENT_FAILED" }),
        orderDto({ orderId: 2, status: "DELIVERED" }),
      ]),
    );
    expect(page.items).toHaveLength(1);
    expect(page.items[0]!.orderId).toBe(2);
  });

  it("BE 0-base 페이지를 FE 1-base로 변환한다", () => {
    const page = mapOrderListPage(
      parseList([orderDto()], {
        number: 2,
        size: 10,
        totalElements: 25,
        totalPages: 3,
      }),
    );
    expect(page.page).toBe(3);
    expect(page.pageSize).toBe(10);
    expect(page.totalCount).toBe(25);
    expect(page.totalPages).toBe(3);
  });
});

describe("mapOrderStatusSummary", () => {
  it("BE 필드명(inProgress/closedCount)을 FE 필드명으로 옮긴다(계약서 §3-3)", () => {
    const dto = orderStatusSummaryDto.parse({
      inProgress: {
        awaitingPayment: 1,
        preparing: 2,
        inDelivery: 3,
        delivered: 4,
      },
      closedCount: {
        returnOrExchange: 5,
        canceled: 6,
      },
    });
    expect(mapOrderStatusSummary(dto)).toEqual({
      paymentPending: 1,
      preparing: 2,
      shipping: 3,
      delivered: 4,
      exchangeRefund: 5,
      canceled: 6,
    });
  });
});
