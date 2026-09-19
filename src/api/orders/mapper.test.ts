import { describe, expect, it } from "vitest";

import {
  mapOrderDelivery,
  mapOrderDetail,
  mapOrderListPage,
  mapOrderStatusSummary,
} from "./mapper";
import {
  orderDeliveryResponseDto,
  orderDetailResponseDto,
  orderListResponseDto,
  orderStatusSummaryDto,
} from "./validation";

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

function orderDetailDto(overrides: Record<string, unknown> = {}) {
  return {
    orderId: 1,
    orderNumber: "ORD00000000001",
    status: "DELIVERED",
    totalAmount: 323000,
    createdAt: "2026-09-01T00:00:00.000Z",
    items: [
      {
        orderItemId: 10,
        productId: 100,
        productName: "백자 달항아리",
        price: 320000,
        quantity: 1,
        thumbnail: [{ url: "https://cdn.midam.store/products/abc.jpg" }],
        artisanName: "김도예",
        options: ["색상: 백자색"],
      },
    ],
    address: {
      addressId: 900,
      recipientName: "홍길동",
      phone: "01012345678",
      zipCode: "06236",
      address1: "서울특별시 강남구 테헤란로 123",
      address2: "미담빌딩 5층",
    },
    shippingAmount: 3000,
    paymentMethod: "CARD",
    discountAmount: 0,
    pointsUsed: 0,
    ...overrides,
  };
}

describe("mapOrderDetail", () => {
  it("BE 원본 상태를 FE 상태로 매핑하고, 아이템에 그대로 복제한다", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(orderDetailDto({ status: "PAID" })),
    );
    expect(detail.groups[0]!.items[0]!.status).toBe("PREPARING");
  });

  it("purchaseConfirmed 플래그가 있으면 상태를 PURCHASE_CONFIRMED로 덮어쓴다(목업 전용, be-requests.md #6)", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(
        orderDetailDto({ status: "DELIVERED", purchaseConfirmed: true }),
      ),
    );
    expect(detail.groups[0]!.items[0]!.status).toBe("PURCHASE_CONFIRMED");
  });

  it("아이템을 artisanName 기준으로 그룹핑한다", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(
        orderDetailDto({
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "A",
              price: 1000,
              quantity: 1,
              thumbnail: [],
              artisanName: "김도예",
            },
            {
              orderItemId: 2,
              productId: 2,
              productName: "B",
              price: 2000,
              quantity: 1,
              thumbnail: [],
              artisanName: "이나전",
            },
            {
              orderItemId: 3,
              productId: 3,
              productName: "C",
              price: 3000,
              quantity: 1,
              thumbnail: [],
              artisanName: "김도예",
            },
          ],
        }),
      ),
    );
    expect(detail.groups).toHaveLength(2);
    expect(detail.groups[0]!.artisanName).toBe("김도예");
    expect(detail.groups[0]!.items).toHaveLength(2);
    expect(detail.groups[1]!.artisanName).toBe("이나전");
  });

  it("세부 금액(배송비·할인·적립금)은 표시용으로 그대로 옮긴다", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(
        orderDetailDto({
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "A",
              price: 10000,
              quantity: 2,
              thumbnail: [],
            },
          ],
          shippingAmount: 3000,
          discountAmount: 1000,
          pointsUsed: 500,
          totalAmount: 21500,
        }),
      ),
    );
    expect(detail.payment).toEqual({
      productAmount: 20000,
      shippingAmount: 3000,
      discountAmount: 1000,
      pointsUsed: 500,
      totalAmount: 21500,
      paymentMethod: "CARD",
    });
  });

  it("결제 금액은 상품·배송비 등을 재계산하지 않고 서버가 내려준 totalAmount를 그대로 쓴다(독립 리뷰 F1)", () => {
    // 실제 BE는 shippingAmount 등 세부 금액을 아직 안 내려준다(be-requests.md #3) — 그래도
    // dto.totalAmount(필수 필드)는 서버가 계산한 진짜 결제 금액이라 이걸 신뢰해야 한다.
    // 세부 금액 합계와 다르더라도(여기선 세부 금액이 전부 0 처리돼 상품 금액만 남음) 결제
    // 금액은 서버 값을 그대로 보여줘야 한다.
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(
        orderDetailDto({
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "A",
              price: 10000,
              quantity: 2,
              thumbnail: [],
            },
          ],
          totalAmount: 23000, // 상품 금액(20000)과 다름 — 배송비 등이 이미 포함된 서버 값
          shippingAmount: undefined,
          discountAmount: undefined,
          pointsUsed: undefined,
        }),
      ),
    );
    expect(detail.payment.totalAmount).toBe(23000);
  });

  it("BE 미제공 필드(paymentMethod·artisanName·options)가 없으면 안전한 기본값을 쓴다", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(
        orderDetailDto({
          paymentMethod: undefined,
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "A",
              price: 1000,
              quantity: 1,
              thumbnail: [],
            },
          ],
        }),
      ),
    );
    expect(detail.payment.paymentMethod).toBeNull();
    expect(detail.groups[0]!.artisanName).toBeNull();
    expect(detail.groups[0]!.items[0]!.options).toEqual([]);
  });

  it("returnInfo.reason을 아이템에 그대로 옮긴다(교환·환불 사유)", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(
        orderDetailDto({
          status: "RETURN_REQUESTED",
          returnInfo: {
            type: "EXCHANGE",
            status: "REQUESTED",
            reason: "제품 파손",
          },
        }),
      ),
    );
    expect(detail.groups[0]!.items[0]!.reason).toBe("제품 파손");
    expect(detail.groups[0]!.items[0]!.cancelInitiator).toBeNull();
  });

  it("CANCELED는 cancelReason·canceledBy를 reason·cancelInitiator로 옮긴다", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(
        orderDetailDto({
          status: "CANCELED",
          cancelReason: "단순 변심",
          canceledBy: "CONSUMER",
        }),
      ),
    );
    expect(detail.groups[0]!.items[0]!.reason).toBe("단순 변심");
    expect(detail.groups[0]!.items[0]!.cancelInitiator).toBe("consumer");
  });

  it("사유·취소 주체가 없으면 null이다", () => {
    const detail = mapOrderDetail(
      orderDetailResponseDto.parse(orderDetailDto({ status: "DELIVERED" })),
    );
    expect(detail.groups[0]!.items[0]!.reason).toBeNull();
    expect(detail.groups[0]!.items[0]!.cancelInitiator).toBeNull();
  });
});

describe("mapOrderDelivery", () => {
  it("DTO 필드를 그대로 옮긴다", () => {
    const delivery = mapOrderDelivery(
      orderDeliveryResponseDto.parse({
        orderId: 1,
        carrier: "CJ대한통운",
        trackingNumber: "600000000001",
        status: "IN_TRANSIT",
      }),
    );
    expect(delivery).toEqual({
      orderId: 1,
      carrier: "CJ대한통운",
      trackingNumber: "600000000001",
      status: "IN_TRANSIT",
    });
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
