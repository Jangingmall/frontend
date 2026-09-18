import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import { OrderCompleteRoute } from "./OrderCompleteRoute";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("OrderCompleteRoute", () => {
  beforeEach(() => {
    push.mockReset();
    usePurchasePreviewStore.getState().resetPreview();
  });

  it("아직 없는 주문 내역 대신 공용 준비 중 Toast를 표시한다", () => {
    render(<OrderCompleteRoute outcome="success" />);

    fireEvent.click(screen.getByRole("button", { name: "주문 내역 보기" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "주문 내역은 준비 중입니다.",
    );
  });

  it("계속 둘러보기는 홈으로 이동한다", () => {
    render(<OrderCompleteRoute outcome="success" />);

    fireEvent.click(screen.getByRole("button", { name: "계속 둘러보기" }));

    expect(push).toHaveBeenCalledWith("/");
  });
});
