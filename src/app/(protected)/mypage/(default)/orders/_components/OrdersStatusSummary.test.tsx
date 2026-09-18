import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrdersStatusSummary } from "./OrdersStatusSummary";

const summary = {
  paymentPending: 1,
  preparing: 2,
  shipping: 3,
  delivered: 4,
  exchangeRefund: 5,
  canceled: 6,
};

describe("OrdersStatusSummary", () => {
  it("로딩 중엔 스켈레톤을 보여준다", () => {
    render(
      <OrdersStatusSummary isPending hasError={false} onRetry={vi.fn()} />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("에러면 재시도 버튼을 보여준다", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    render(
      <OrdersStatusSummary isPending={false} hasError onRetry={handleRetry} />,
    );
    await user.click(screen.getByRole("button", { name: /재시도|다시/ }));
    expect(handleRetry).toHaveBeenCalled();
  });

  it("4단계 카운트와 교환환불·주문취소 카운트를 보여준다", () => {
    render(
      <OrdersStatusSummary
        data={summary}
        isPending={false}
        hasError={false}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText("입금 확인 중")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("상품 준비 중")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("배송 중")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("배송 완료")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === "교환 · 환불"),
    ).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("주문취소")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("(최근 3개월 기준)")).toBeInTheDocument();
  });
});
