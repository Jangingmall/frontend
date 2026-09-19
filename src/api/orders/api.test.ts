import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { fetchOrdersList, fetchOrderStatusSummary } from "./api";
import { orderFixtures } from "./mock/fixtures";

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
