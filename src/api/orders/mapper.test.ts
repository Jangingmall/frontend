import { describe, expect, it } from "vitest";

import { seedImageRef } from "@/mocks/seed";

import { mapOrderListPage, mapOrderStatusSummary } from "./mapper";

describe("mapOrderListPage", () => {
  it("DTO를 Page<OrderGroup>으로 변환한다", () => {
    const thumbnail = seedImageRef(1);
    const result = mapOrderListPage(
      {
        items: [
          {
            orderId: 1,
            orderNumber: "JJ000001",
            orderedAt: "2026-09-01T00:00:00.000Z",
            items: [
              {
                productId: 10,
                thumbnail,
                productName: "백자 달항아리",
                price: 320000,
                status: "DELIVERED",
                artisanName: "김도예",
              },
            ],
          },
        ],
        totalCount: 25,
      },
      { page: 2, size: 10 },
    );

    expect(result).toEqual({
      items: [
        {
          orderId: 1,
          orderNumber: "JJ000001",
          orderedAt: "2026-09-01T00:00:00.000Z",
          items: [
            {
              productId: 10,
              thumbnail,
              productName: "백자 달항아리",
              price: 320000,
              status: "DELIVERED",
              reason: undefined,
              artisanName: "김도예",
            },
          ],
        },
      ],
      page: 2,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
    });
  });

  it("reason이 있으면 그대로 옮긴다", () => {
    const result = mapOrderListPage(
      {
        items: [
          {
            orderId: 1,
            orderNumber: "JJ000001",
            orderedAt: "2026-09-01T00:00:00.000Z",
            items: [
              {
                productId: 10,
                thumbnail: seedImageRef(1),
                productName: "백자 달항아리",
                price: 320000,
                status: "CANCELED",
                reason: "주문 승인 거절 ( 작업 불가 )",
                artisanName: "김도예",
              },
            ],
          },
        ],
        totalCount: 1,
      },
      { page: 1, size: 10 },
    );
    expect(result.items[0]!.items[0]!.reason).toBe(
      "주문 승인 거절 ( 작업 불가 )",
    );
  });
});

describe("mapOrderStatusSummary", () => {
  it("DTO 필드를 그대로 옮긴다", () => {
    const dto = {
      paymentPending: 1,
      preparing: 2,
      shipping: 3,
      delivered: 4,
      exchangeRefund: 5,
      canceled: 6,
    };
    expect(mapOrderStatusSummary(dto)).toEqual(dto);
  });
});
