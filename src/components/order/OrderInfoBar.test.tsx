import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrderInfoBar } from "./OrderInfoBar";

describe("OrderInfoBar", () => {
  it("single variant는 상태 배지·주문번호·주문일시를 보여준다", () => {
    render(
      <OrderInfoBar
        status="DELIVERED"
        orderNumber="JJ000000"
        orderDate="2026.08.28"
      />,
    );
    expect(screen.getByText("배송 완료")).toBeInTheDocument();
    expect(screen.getByText("JJ000000")).toBeInTheDocument();
    expect(screen.getByText("2026.08.28")).toBeInTheDocument();
  });

  it("multi variant는 '총 N 건'을 보여준다", () => {
    render(
      <OrderInfoBar
        variant="multi"
        itemCount={3}
        orderNumber="JJ000001"
        orderDate="2026.08.28"
      />,
    );
    expect(screen.getByText("총 3 건")).toBeInTheDocument();
    expect(screen.queryByText("배송 완료")).not.toBeInTheDocument();
  });
});
