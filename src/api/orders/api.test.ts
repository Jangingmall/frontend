import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import {
  changeOrderAddress,
  confirmPurchase,
  fetchOrderDelivery,
  fetchOrderDetail,
  fetchOrdersList,
  fetchOrderStatusSummary,
  requestOrderCancel,
  requestOrderExchangeRefund,
} from "./api";
import { orderFixtures } from "./mock/fixtures";

// 상태별 주문 id를 파일 로드 시점(= 어떤 mutation 테스트도 실행되기 전)에 한 번만 캡처한다.
// mutation 테스트가 나중에 이 배열의 `status`를 바꾸므로, 매번 `.find`로 다시 찾으면
// 이전 mutation 테스트의 영향을 받아 다른 주문을 가리킬 수 있다 — 테스트끼리 별개
// 주문을 쓰도록 인덱스로 고정한다.
const createdOrderIds = orderFixtures
  .filter((order) => order.status === "CREATED")
  .map((order) => order.orderId);
const paidOrderId = orderFixtures.find(
  (order) => order.status === "PAID",
)!.orderId;
const deliveredOrderIds = orderFixtures
  .filter((order) => order.status === "DELIVERED")
  .map((order) => order.orderId);
const deliveredOrderId = deliveredOrderIds[0]!;
const inDeliveryOrderId = orderFixtures.find(
  (order) => order.status === "IN_DELIVERY",
)!.orderId;

describe("fetchOrdersList", () => {
  it("기본 조회는 최신순 첫 페이지(size 10)를 돌려준다", async () => {
    const result = await fetchOrdersList();
    expect(result.totalCount).toBe(orderFixtures.length);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.items).toHaveLength(10);
  });

  it("다음 페이지를 조회할 수 있다", async () => {
    const first = await fetchOrdersList({ page: 1 });
    const second = await fetchOrdersList({ page: 2 });
    expect(second.items[0]!.orderId).not.toBe(first.items[0]!.orderId);
  });

  it("상태 그룹으로 필터링한다(SHIPPING → BE IN_DELIVERY)", async () => {
    const expectedCount = orderFixtures.filter(
      (order) => order.status === "IN_DELIVERY",
    ).length;
    const result = await fetchOrdersList({ status: "SHIPPING", size: 100 });
    expect(result.totalCount).toBe(expectedCount);
    expect(result.totalCount).toBeGreaterThan(0);
  });

  it("교환·환불 그룹은 BE RETURN_REQUESTED 하나로 조회한다(계약서 §4)", async () => {
    const expectedCount = orderFixtures.filter(
      (order) => order.status === "RETURN_REQUESTED",
    ).length;
    const result = await fetchOrdersList({
      status: "EXCHANGE_REFUND",
      size: 100,
    });
    expect(result.totalCount).toBe(expectedCount);
    expect(result.totalCount).toBeGreaterThan(0);
  });

  it("장인 이름으로 검색한다", async () => {
    const expectedCount = orderFixtures.filter((order) =>
      order.items.some((item) => item.artisanName.includes("김도예")),
    ).length;
    const result = await fetchOrdersList({
      artisanName: "김도예",
      size: 100,
    });
    expect(result.totalCount).toBe(expectedCount);
    expect(result.totalCount).toBeGreaterThan(0);
  });

  it("검색 결과가 없으면 totalPages도 0을 반환한다(Codex 리뷰)", async () => {
    const result = await fetchOrdersList({
      artisanName: "존재하지-않는-장인",
      size: 100,
    });
    expect(result.totalCount).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it("기간으로 필터링한다", async () => {
    const from = dayjs().subtract(10, "day").format("YYYY-MM-DD");
    const to = dayjs().format("YYYY-MM-DD");
    const expectedCount = orderFixtures.filter(
      (order) =>
        !dayjs(order.createdAt).isBefore(dayjs(from), "day") &&
        !dayjs(order.createdAt).isAfter(dayjs(to), "day"),
    ).length;
    const result = await fetchOrdersList({ from, to, size: 100 });
    expect(result.totalCount).toBe(expectedCount);
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.totalCount).toBeLessThan(orderFixtures.length);
  });
});

describe("fetchOrderStatusSummary", () => {
  it("최근 3개월 기준 상태별 카운트를 돌려준다", async () => {
    const summary = await fetchOrderStatusSummary();
    const total =
      summary.paymentPending +
      summary.preparing +
      summary.shipping +
      summary.delivered +
      summary.exchangeRefund +
      summary.canceled;
    expect(total).toBeGreaterThan(0);
  });
});

describe("fetchOrderDetail", () => {
  it("주문 상세를 조회한다", async () => {
    const detail = await fetchOrderDetail(deliveredOrderId);
    expect(detail.orderId).toBe(deliveredOrderId);
    expect(detail.groups.length).toBeGreaterThan(0);
    expect(detail.shippingAddress.recipientName).toBeTruthy();
  });

  it("존재하지 않는 주문은 404를 던진다", async () => {
    await expect(fetchOrderDetail(999_999)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("fetchOrderDelivery", () => {
  it("배송 중 주문은 IN_TRANSIT 상태를 돌려준다", async () => {
    const delivery = await fetchOrderDelivery(inDeliveryOrderId);
    expect(delivery.status).toBe("IN_TRANSIT");
    expect(delivery.trackingNumber).toBeTruthy();
  });
});

describe("requestOrderCancel", () => {
  it("취소를 요청하면 사유가 반영되어 상세 상태가 CANCELED로 바뀐다", async () => {
    const orderId = createdOrderIds[0]!;
    await requestOrderCancel(orderId, {
      reason: "단순 변심",
      imageIds: [],
    });
    const detail = await fetchOrderDetail(orderId);
    expect(detail.groups[0]!.items[0]!.status).toBe("CANCELED");
  });

  it("존재하지 않는 주문은 404를 던진다", async () => {
    await expect(
      requestOrderCancel(999_999_999, { reason: "단순 변심", imageIds: [] }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("requestOrderExchangeRefund", () => {
  it("교환·환불을 신청하면 상세 상태가 RETURN_REQUESTED로 바뀐다", async () => {
    const orderId = deliveredOrderIds[1]!;
    const detailBefore = await fetchOrderDetail(orderId);
    const orderItemId = detailBefore.groups[0]!.items[0]!.orderItemId;

    await requestOrderExchangeRefund(orderId, {
      type: "RETURN",
      orderItemId,
      reason: "CHANGE_OF_MIND",
      description: "단순 변심",
      imageIds: [],
    });

    const detail = await fetchOrderDetail(orderId);
    expect(detail.groups[0]!.items[0]!.status).toBe("REFUND_REQUESTED");
    expect(detail.groups[0]!.items[0]!.reason).toBe("단순 변심");
  });

  it("존재하지 않는 주문은 404를 던진다", async () => {
    await expect(
      requestOrderExchangeRefund(999_999_999, {
        type: "EXCHANGE",
        orderItemId: 1,
        reason: "DEFECTIVE",
        imageIds: [],
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("confirmPurchase", () => {
  it("배송 완료 주문을 구매 확정하면 상태가 PURCHASE_CONFIRMED로 바뀐다", async () => {
    await confirmPurchase(deliveredOrderId);
    const detail = await fetchOrderDetail(deliveredOrderId);
    expect(detail.groups[0]!.items[0]!.status).toBe("PURCHASE_CONFIRMED");
  });

  it("배송 완료가 아닌 주문은 구매 확정할 수 없다", async () => {
    await expect(confirmPurchase(paidOrderId)).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe("changeOrderAddress", () => {
  it("입금 확인 중 주문의 배송지를 변경하면 상세 조회에 반영된다", async () => {
    const orderId = createdOrderIds[1]!;
    await changeOrderAddress(orderId, {
      recipientName: "박변경",
      phone: "01055556666",
      zipCode: "12345",
      address1: "변경된 주소",
      address2: "2층",
    });
    const detail = await fetchOrderDetail(orderId);
    expect(detail.shippingAddress).toEqual({
      recipientName: "박변경",
      phone: "01055556666",
      zipCode: "12345",
      address1: "변경된 주소",
      address2: "2층",
    });
  });

  it("배송지를 변경할 수 없는 상태(배송 완료)면 실패한다", async () => {
    await expect(
      changeOrderAddress(deliveredOrderId, {
        recipientName: "박변경",
        phone: "01055556666",
        zipCode: "12345",
        address1: "변경된 주소",
        address2: "2층",
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
});
