import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrdersFilterBar } from "./OrdersFilterBar";

function renderBar(
  overrides: Partial<Parameters<typeof OrdersFilterBar>[0]> = {},
) {
  const props = {
    period: "MONTH_3" as const,
    from: "2026-06-18",
    to: "2026-09-18",
    status: "ALL" as const,
    artisanName: undefined,
    onPeriodChange: vi.fn(),
    onCustomRangeChange: vi.fn(),
    onStatusChange: vi.fn(),
    onSearch: vi.fn(),
    ...overrides,
  };
  render(<OrdersFilterBar {...props} />);
  return props;
}

describe("OrdersFilterBar", () => {
  it("검색어를 입력하고 Enter를 누르면 onSearch를 호출한다", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    const input = screen.getByLabelText("장인 이름 검색");
    await user.type(input, "김도예{Enter}");
    expect(props.onSearch).toHaveBeenCalledWith("김도예");
  });

  it("현재 선택된 기간 프리셋이 표시된다", () => {
    renderBar({ period: "MONTH_3" });
    expect(
      screen.getByRole("radio", { name: "3개월", checked: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "1개월", checked: false }),
    ).toBeInTheDocument();
  });

  it("기간 프리셋 버튼을 클릭하면 onPeriodChange를 호출한다", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    await user.click(screen.getByRole("radio", { name: "1개월" }));
    expect(props.onPeriodChange).toHaveBeenCalledWith("MONTH_1");
  });

  it("주문 처리 상태 탭을 클릭하면 onStatusChange를 호출한다", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    await user.click(screen.getByRole("radio", { name: "배송 중" }));
    expect(props.onStatusChange).toHaveBeenCalledWith("SHIPPING");
  });

  it("현재 선택된 상태 탭이 표시된다", () => {
    renderBar({ status: "DELIVERED" });
    expect(
      screen.getByRole("radio", { name: "배송 완료", checked: true }),
    ).toBeInTheDocument();
  });

  it("안내 문구 4줄을 보여준다", () => {
    renderBar();
    expect(
      screen.getByText(/취소 \/ 교환 \/ 반품 신청은 배송 완료일 기준/),
    ).toBeInTheDocument();
  });
});
