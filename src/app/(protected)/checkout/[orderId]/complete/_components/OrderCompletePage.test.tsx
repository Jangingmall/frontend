import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderCompletePage } from "./OrderCompletePage";

describe("OrderCompletePage", () => {
  it("카드 결제 완료 안내와 두 작업 콜백을 제공한다", () => {
    const onViewOrders = vi.fn();
    const onContinueBrowsing = vi.fn();

    render(
      <OrderCompletePage
        outcome="success"
        onViewOrders={onViewOrders}
        onContinueBrowsing={onContinueBrowsing}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "주문이 완료되었습니다" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("장인이 주문을 확인한 후 제작을 시작할 예정입니다."),
    ).toBeInTheDocument();
    expect(screen.queryByText("가상계좌 정보")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "주문 내역 보기" }));
    fireEvent.click(screen.getByRole("button", { name: "계속 둘러보기" }));
    expect(onViewOrders).toHaveBeenCalledOnce();
    expect(onContinueBrowsing).toHaveBeenCalledOnce();
  });

  it("무통장입금 대기 상태에는 승인 대신 고정 가상계좌 안내와 주문 합계를 표시한다", () => {
    render(
      <OrderCompletePage
        outcome="bank-pending"
        totalAmount={123_400}
        onViewOrders={vi.fn()}
        onContinueBrowsing={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "아래의 계좌로 입금해주시면 정상적으로 결제 완료 처리가 됩니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("가상계좌 정보")).toBeInTheDocument();
    expect(screen.getByText("123,400원")).toBeInTheDocument();
    expect(screen.getByText("NNNN.NN.NN 00:00까지")).toBeInTheDocument();
  });
});
