import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MypageOrdersPage from "./page";

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
  return render(<MypageOrdersPage />, { wrapper: Wrapper });
}

describe("MypageOrdersPage", () => {
  const previousUrl = window.location.href;

  beforeEach(() => {
    window.history.replaceState(null, "", "/mypage/orders");
  });

  afterEach(() => {
    window.history.replaceState(null, "", previousUrl);
  });

  it("주문 현황 요약·필터·목록을 조회해 보여준다", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("(최근 3개월 기준)")).toBeInTheDocument(),
    );
    expect(await screen.findAllByText("주문번호 :")).not.toHaveLength(0);
  });

  it("상태 탭을 클릭하면 URL에 상태 필터가 반영된다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("주문번호 :");
    await user.click(screen.getByRole("button", { name: "배송 중" }));
    expect(new URLSearchParams(window.location.search).get("status")).toBe(
      "SHIPPING",
    );
  });

  it("장인 이름을 검색하면 URL에 반영된다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("주문번호 :");
    await user.type(screen.getByLabelText("장인 이름 검색"), "김도예{Enter}");
    expect(new URLSearchParams(window.location.search).get("artisanName")).toBe(
      "김도예",
    );
  });

  it("페이지네이션 클릭 시 URL에 page가 반영된다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("주문번호 :");
    await user.click(screen.getByRole("button", { name: "2 페이지" }));
    expect(new URLSearchParams(window.location.search).get("page")).toBe("2");
  });
});
