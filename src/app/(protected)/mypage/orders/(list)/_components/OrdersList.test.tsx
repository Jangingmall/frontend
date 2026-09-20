import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Page } from "@/types/api";
import type { OrderGroup } from "@/types/order";

import { OrdersList } from "./OrdersList";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

function order(overrides: Partial<OrderGroup> = {}): OrderGroup {
  return {
    orderId: 1,
    orderNumber: "JJ000001",
    orderedAt: "2026-08-28T00:00:00.000Z",
    items: [
      {
        orderItemId: 100,
        productId: 10,
        thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
        productName: "백자 달항아리",
        price: 320000,
        quantity: 1,
        status: "DELIVERED",
        reason: null,
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

  it("이번 페이지가 비어도 다른 페이지가 있으면 페이지네이션을 계속 보여준다(Codex 리뷰 F1)", async () => {
    const user = userEvent.setup();
    const handlePageChange = vi.fn();
    render(
      <OrdersList
        data={page([], { page: 3, totalPages: 3, totalCount: 25 })}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={handlePageChange}
      />,
    );
    expect(screen.getByText("조건에 맞는 주문이 없어요")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "1 페이지" }));
    expect(handlePageChange).toHaveBeenCalledWith(1);
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
          orderItemId: 100,
          productId: 10,
          thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
          productName: "백자 달항아리",
          price: 320000,
          quantity: 1,
          status: "PREPARING",
          reason: null,
        },
        {
          orderItemId: 101,
          productId: 11,
          thumbnailUrl: "https://cdn.midam.store/products/2.jpg",
          productName: "옻칠 3단 찬합",
          price: 189000,
          quantity: 1,
          status: "DELIVERED",
          reason: null,
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
    const compactRow = screen.getByTestId("order-compact-row");
    const detailRow = screen.getByTestId("order-detail-row");

    // 접힘 상태 — 대표 카드(첫 아이템)만 보이고, 상세 행은 애니메이션용으로 DOM엔 있지만
    // `aria-hidden`·`inert` 처리돼 접근성 트리·포커스에서 제외된다.
    expect(compactRow).toHaveAttribute("aria-hidden", "false");
    expect(detailRow).toHaveAttribute("aria-hidden", "true");
    expect(within(compactRow).getByText("백자 달항아리")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /총 2건 주문 펼쳐보기/ }),
    );

    expect(compactRow).toHaveAttribute("aria-hidden", "true");
    expect(detailRow).toHaveAttribute("aria-hidden", "false");
    expect(within(detailRow).getByText("옻칠 3단 찬합")).toBeInTheDocument();
    expect(within(detailRow).getByText("상품 준비 중")).toBeInTheDocument();
    expect(within(detailRow).getByText("배송 완료")).toBeInTheDocument();
  });

  it("펼친 상세 카드는 실측 높이를 쓰고 고정 상한에 잘리지 않는다(Codex 리뷰 F3)", async () => {
    const user = userEvent.setup();
    // jsdom엔 실제 레이아웃 엔진이 없어 scrollHeight가 항상 0이다. 상품이 많은 주문의 실제
    // 콘텐츠 높이(999px 상한을 넘는 값)를 흉내내, 그 값이 그대로 max-height에 반영되는지
    // (고정 상한에 잘리지 않는지) 확인한다.
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, "scrollHeight", "get")
      .mockReturnValue(1200);

    const multi = order({
      orderId: 3,
      orderNumber: "JJ000003",
      items: Array.from({ length: 6 }, (_, i) => ({
        orderItemId: 200 + i,
        productId: 20 + i,
        thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
        productName: `상품 ${i + 1}`,
        price: 10000,
        quantity: 1,
        status: "DELIVERED" as const,
        reason: null,
      })),
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

    const detailRow = screen.getByTestId("order-detail-row");
    expect(detailRow.style.maxHeight).toBe("0px");

    await user.click(
      screen.getByRole("button", { name: /총 6건 주문 펼쳐보기/ }),
    );

    expect(detailRow.style.maxHeight).toBe("1200px");

    scrollHeightSpy.mockRestore();
  });

  it("단일 상품 주문의 주문 상세보기 클릭 시 상세 화면으로 이동한다(T-28)", async () => {
    const user = userEvent.setup();
    render(
      <OrdersList
        data={page([order({ orderId: 42 })])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /주문 상세보기/ }));
    expect(mockPush).toHaveBeenCalledWith("/mypage/orders/42");
  });

  it("다중 상품 주문의 주문 상세보기 클릭 시 상세 화면으로 이동한다(T-28)", async () => {
    const user = userEvent.setup();
    const multi = order({
      orderId: 7,
      items: [
        {
          orderItemId: 100,
          productId: 10,
          thumbnailUrl: null,
          productName: "백자 달항아리",
          price: 320000,
          quantity: 1,
          status: "DELIVERED",
          reason: null,
        },
        {
          orderItemId: 101,
          productId: 11,
          thumbnailUrl: null,
          productName: "옻칠 3단 찬합",
          price: 189000,
          quantity: 1,
          status: "DELIVERED",
          reason: null,
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
    await user.click(
      within(screen.getByTestId("order-compact-row")).getByRole("button", {
        name: /주문 상세보기/,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/mypage/orders/7");
  });

  it("onAction이 있으면 구현된 액션 버튼이 활성화되고 order·item·action을 전달한다", async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(
      <OrdersList
        data={page([
          order({
            orderId: 5,
            orderNumber: "JJ000005",
            items: [
              {
                orderItemId: 100,
                productId: 10,
                thumbnailUrl: null,
                productName: "백자 달항아리",
                price: 320000,
                quantity: 1,
                status: "PAYMENT_PENDING",
                reason: null,
              },
            ],
          }),
        ])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={vi.fn()}
        onAction={handleAction}
      />,
    );
    await user.click(screen.getByRole("button", { name: "주문 취소" }));
    expect(handleAction).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 5, orderNumber: "JJ000005" }),
      expect.objectContaining({ orderItemId: 100 }),
      "cancelOrder",
    );
  });

  it("reason이 있으면 사유 배너를 보여준다", () => {
    render(
      <OrdersList
        data={page([
          order({
            items: [
              {
                orderItemId: 100,
                productId: 10,
                thumbnailUrl: null,
                productName: "백자 달항아리",
                price: 320000,
                quantity: 1,
                status: "REFUND_REJECTED",
                reason: "상품 사용에 따른 파손",
              },
            ],
          }),
        ])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("상품 사용에 따른 파손")).toBeInTheDocument();
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
