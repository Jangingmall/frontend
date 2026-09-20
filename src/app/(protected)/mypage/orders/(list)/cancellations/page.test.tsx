import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MypageOrderCancellationsPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ push: vi.fn() }),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<MypageOrderCancellationsPage />, { wrapper: Wrapper });
}

describe("MypageOrderCancellationsPage", () => {
  const previousUrl = window.location.href;

  beforeEach(() => {
    window.history.replaceState(null, "", "/mypage/orders/cancellations");
  });

  afterEach(() => {
    window.history.replaceState(null, "", previousUrl);
  });

  it("취소/교환·환불 상태의 주문만 필터링해 보여준다", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByText("주문번호 :").length).toBeGreaterThan(0),
    );
    // MY-1의 8탭이 아니라 3탭만 있어야 한다.
    expect(
      screen.queryByRole("button", { name: "배송 중" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "교환 · 환불" }),
    ).toBeInTheDocument();
  });

  it("이 화면 전용 안내 문구를 보여준다(MY-1과 다름)", async () => {
    renderPage();
    await screen.findAllByText("주문번호 :");
    expect(
      screen.getByText(
        "취소 완료 후 결제수단에 따라 환불까지 일정 기간이 소요될 수 있습니다.",
      ),
    ).toBeInTheDocument();
  });

  it("내 주문 현황 요약 스트립을 보여주지 않는다", async () => {
    renderPage();
    await screen.findAllByText("주문번호 :");
    expect(screen.queryByText("내 주문 현황 보기")).not.toBeInTheDocument();
  });

  it("주문 취소 상태 탭을 클릭하면 URL에 반영된다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("주문번호 :");
    const statusGroup = screen.getByRole("group", { name: "주문 처리 상태" });
    await user.click(
      within(statusGroup).getByRole("button", { name: "주문 취소" }),
    );
    expect(new URLSearchParams(window.location.search).get("status")).toBe(
      "CANCELED",
    );
  });
});
