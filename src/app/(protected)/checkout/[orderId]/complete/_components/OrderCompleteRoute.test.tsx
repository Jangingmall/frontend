import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicEnv } from "@/lib/env";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import { OrderCompleteRoute } from "./OrderCompleteRoute";

const push = vi.fn();
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("OrderCompleteRoute", () => {
  beforeEach(() => {
    push.mockReset();
    Object.assign(publicEnv, { apiMocking: true });
    usePurchasePreviewStore.getState().resetPreview();
  });

  it("시연 주문은 실제 주문 내역에 저장되지 않았음을 안내한다", () => {
    render(<OrderCompleteRoute outcome="success" />);

    fireEvent.click(screen.getByRole("button", { name: "주문 내역 보기" }));

    expect(
      screen.getByText("시연 주문은 실제 주문 내역에 저장되지 않습니다."),
    ).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it("계속 둘러보기는 홈으로 이동한다", () => {
    render(<OrderCompleteRoute outcome="success" />);

    fireEvent.click(screen.getByRole("button", { name: "계속 둘러보기" }));

    expect(push).toHaveBeenCalledWith("/");
  });

  it("API 모드는 완료 화면에서 실제 주문 내역으로 이동한다", () => {
    Object.assign(publicEnv, { apiMocking: false });
    render(<OrderCompleteRoute outcome="success" />);
    fireEvent.click(screen.getByRole("button", { name: "주문 내역 보기" }));
    expect(push).toHaveBeenCalledWith("/mypage/orders");
    expect(
      screen.queryByText("시연 주문은 실제 주문 내역에 저장되지 않습니다."),
    ).not.toBeInTheDocument();
  });
});
