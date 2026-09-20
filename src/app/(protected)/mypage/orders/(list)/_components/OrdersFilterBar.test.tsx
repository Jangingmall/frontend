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
  const view = render(<OrdersFilterBar {...props} />);
  return { ...props, rerender: view.rerender };
}

describe("OrdersFilterBar", () => {
  it("검색어를 입력하고 Enter를 누르면 onSearch를 호출한다", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    const input = screen.getByLabelText("장인 이름 검색");
    await user.type(input, "김도예{Enter}");
    expect(props.onSearch).toHaveBeenCalledWith("김도예");
  });

  it("검색 확정 후 같은 값의 artisanName이 내려와도 입력창이 리마운트되지 않아 포커스를 유지한다(Codex 리뷰 F2 재발 방지)", async () => {
    const user = userEvent.setup();
    const { rerender } = renderBar({ artisanName: undefined });
    const input = screen.getByLabelText("장인 이름 검색");
    await user.type(input, "김도예{Enter}");
    expect(input).toHaveFocus();

    // 실제 통합에서는 onSearch → URL 갱신 → 같은 값의 artisanName prop이 내려온다.
    rerender(
      <OrdersFilterBar
        period="MONTH_3"
        from="2026-06-18"
        to="2026-09-18"
        status="ALL"
        artisanName="김도예"
        onPeriodChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
        onStatusChange={vi.fn()}
        onSearch={vi.fn()}
      />,
    );

    const inputAfter = screen.getByLabelText("장인 이름 검색");
    expect(inputAfter).toBe(input);
    expect(inputAfter).toHaveValue("김도예");
    expect(inputAfter).toHaveFocus();
  });

  it("artisanName이 외부에서 바뀌면(뒤로가기 등) 입력창도 갱신된다(Codex 리뷰 F2)", () => {
    const { rerender } = renderBar({ artisanName: "김도예" });
    expect(screen.getByLabelText("장인 이름 검색")).toHaveValue("김도예");

    rerender(
      <OrdersFilterBar
        period="MONTH_3"
        from="2026-06-18"
        to="2026-09-18"
        status="ALL"
        artisanName={undefined}
        onPeriodChange={vi.fn()}
        onCustomRangeChange={vi.fn()}
        onStatusChange={vi.fn()}
        onSearch={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("장인 이름 검색")).toHaveValue("");
  });

  it("현재 선택된 기간 프리셋이 표시된다", () => {
    renderBar({ period: "MONTH_3" });
    expect(
      screen.getByRole("button", { name: "3개월", pressed: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1개월", pressed: false }),
    ).toBeInTheDocument();
  });

  it("기간 프리셋 버튼을 클릭하면 onPeriodChange를 호출한다", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    await user.click(screen.getByRole("button", { name: "1개월" }));
    expect(props.onPeriodChange).toHaveBeenCalledWith("MONTH_1");
  });

  it("주문 처리 상태 탭을 클릭하면 onStatusChange를 호출한다", async () => {
    const user = userEvent.setup();
    const props = renderBar();
    await user.click(screen.getByRole("button", { name: "배송 중" }));
    expect(props.onStatusChange).toHaveBeenCalledWith("SHIPPING");
  });

  it("현재 선택된 상태 탭이 표시된다", () => {
    renderBar({ status: "DELIVERED" });
    expect(
      screen.getByRole("button", { name: "배송 완료", pressed: true }),
    ).toBeInTheDocument();
  });

  it("안내 문구 4줄을 보여준다", () => {
    renderBar();
    expect(
      screen.getByText(/취소 \/ 교환 \/ 반품 신청은 배송 완료일 기준/),
    ).toBeInTheDocument();
  });

  it("statusTabs를 넘기면 그 탭만 보여준다(MY-2)", () => {
    renderBar({
      statusTabs: [
        { key: "ALL", label: "전체" },
        { key: "EXCHANGE_REFUND", label: "교환 · 환불" },
        { key: "CANCELED", label: "주문 취소" },
      ],
    });
    expect(
      screen.getByRole("group", { name: "주문 처리 상태" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "배송 중" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "주문 취소" }),
    ).toBeInTheDocument();
  });

  it("notices를 넘기면 그 문구만 보여준다(MY-2)", () => {
    renderBar({ notices: ["MY-2 전용 안내 문구"] });
    expect(screen.getByText("MY-2 전용 안내 문구")).toBeInTheDocument();
    expect(screen.queryByText(/단순 변심에 의한 교환/)).not.toBeInTheDocument();
  });
});
