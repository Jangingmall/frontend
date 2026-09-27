import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PurchaseConfirmationDialog } from "./PurchaseConfirmationDialog";

describe("PurchaseConfirmationDialog", () => {
  it("전체 주문 확정의 범위를 설명하고 취소 시 요청하지 않는다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <PurchaseConfirmationDialog
        open
        orderNumber="JJ123"
        submitting={false}
        error={null}
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText(/JJ123에 포함된 모든 상품/)).toHaveTextContent(
      "교환·환불을 신청할 수 없습니다",
    );
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it("요청 중에는 중복 확정과 닫기를 막고 실패 메시지를 표시한다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <PurchaseConfirmationDialog
        open
        orderNumber="JJ123"
        submitting
        error="주문 상태를 확인해주세요."
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "주문 상태를 확인해주세요.",
    );
    expect(
      screen.getByRole("button", { name: "주문 전체 구매 확정" }),
    ).toHaveAttribute("aria-busy", "true");
    screen.getByRole("button", { name: "주문 전체 구매 확정" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
