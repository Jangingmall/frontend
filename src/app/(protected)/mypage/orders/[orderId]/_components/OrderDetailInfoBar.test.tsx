import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrderDetailInfoBar } from "./OrderDetailInfoBar";

describe("OrderDetailInfoBar", () => {
  it("주문번호·주문일시를 보여주고, 상태 배지는 없다(Figma 실측 — 목록과 다른 컴포넌트)", () => {
    render(
      <OrderDetailInfoBar orderNumber="JJ000000" orderDate="2026.08.28" />,
    );
    expect(screen.getByText("JJ000000")).toBeInTheDocument();
    expect(screen.getByText("2026.08.28")).toBeInTheDocument();
    expect(screen.queryByText("배송 완료")).not.toBeInTheDocument();
  });

  it("주문 영수증 버튼은 비활성 상태로 렌더한다(영수증 기능 범위 밖)", () => {
    render(
      <OrderDetailInfoBar orderNumber="JJ000000" orderDate="2026.08.28" />,
    );
    expect(
      screen.getByRole("button", { name: "주문 영수증 준비 중" }),
    ).toBeDisabled();
  });
});
