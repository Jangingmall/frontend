import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Page } from "@/types/api";
import type { OrderGroup } from "@/types/order";

import { OrdersList } from "./OrdersList";

function order(overrides: Partial<OrderGroup> = {}): OrderGroup {
  return {
    orderId: 1,
    orderNumber: "JJ000001",
    orderedAt: "2026-08-28T00:00:00.000Z",
    items: [
      {
        productId: 10,
        thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
        productName: "백자 달항아리",
        price: 320000,
        quantity: 1,
        status: "DELIVERED",
      },
    ],
    ...overrides,
  };
}

function page(items: OrderGroup[], overrides: Partial<Page<OrderGroup>> = {}) {
  return {
    items,
    page: 1,
    pageSize: 10,
    totalCount: items.length,
    totalPages: 1,
    ...overrides,
  };
}

describe("OrdersList", () => {
  it("로딩 중엔 스켈레톤을 보여준다", () => {
    render(
      <OrdersList
        isPending
        isFetching
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("에러면 재시도 버튼을 보여준다", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    render(
      <OrdersList
        isPending={false}
        isFetching={false}
        hasError
        onRetry={handleRetry}
        onPageChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /다시/ }));
    expect(handleRetry).toHaveBeenCalled();
  });

  it("빈 목록이면 안내를 보여준다", () => {
    render(
      <OrdersList
        data={page([])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("조건에 맞는 주문이 없어요")).toBeInTheDocument();
  });

  it("단일 상품 주문은 자기 배지를 숨기고 info bar에만 상태를 보여준다", () => {
    render(
      <OrdersList
        data={page([order()])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("주문번호 :")).toBeInTheDocument();
    expect(screen.getByText("JJ000001")).toBeInTheDocument();
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    // info bar 배지에 상태 라벨이 딱 1번만 나온다(카드 자체 배지는 숨김)
    expect(screen.getAllByText("배송 완료")).toHaveLength(1);
  });

  it("다중 상품 주문은 접힌 대표 카드로 시작하고, 펼치면 각자 상태를 보여준다", async () => {
    const user = userEvent.setup();
    const multi = order({
      orderId: 2,
      orderNumber: "JJ000002",
      items: [
        {
          productId: 10,
          thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
          productName: "백자 달항아리",
          price: 320000,
          quantity: 1,
          status: "PREPARING",
        },
        {
          productId: 11,
          thumbnailUrl: "https://cdn.midam.store/products/2.jpg",
          productName: "옻칠 3단 찬합",
          price: 189000,
          quantity: 1,
          status: "DELIVERED",
        },
      ],
    });
    render(
      <OrdersList
        data={page([multi])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("총 2 건")).toBeInTheDocument();
    // 접힘 상태 — 대표 카드(첫 아이템)만, 개별 상태 배지 없음
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(screen.queryByText("옻칠 3단 찬합")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /총 2건 주문 펼쳐보기/ }),
    );

    expect(screen.getByText("옻칠 3단 찬합")).toBeInTheDocument();
    expect(screen.getByText("상품 준비 중")).toBeInTheDocument();
    expect(screen.getByText("배송 완료")).toBeInTheDocument();
  });

  it("페이지네이션 클릭 시 onPageChange를 호출한다", async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();
    render(
      <OrdersList
        data={page([order()], { totalPages: 3, totalCount: 25 })}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={handlePageChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "2 페이지" }));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
});
