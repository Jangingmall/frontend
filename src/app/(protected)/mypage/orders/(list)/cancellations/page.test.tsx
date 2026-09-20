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

  it("'전체' 탭(기본값)에서도 교환·환불·취소 외의 상태 카드는 뜨지 않는다", async () => {
    renderPage();
    await screen.findAllByText("주문번호 :");
    // 이 화면에 없는 상태(SHIPPING/DELIVERED/PREPARING/PAYMENT_PENDING) 배지가 카드에
    // 섞여 들어오면 안 된다 — status=ALL이 BE에 "필터 없음"으로 보내지던 버그의 회귀 테스트.
    for (const label of [
      "배송 중",
      "배송 완료",
      "상품 준비 중",
      "입금 확인 중",
    ]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
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

  it("URL의 status가 이 화면 3탭 밖 값이면 전체로 되돌린다(CodeRabbit 리뷰)", async () => {
    window.history.replaceState(
      null,
      "",
      "/mypage/orders/cancellations?status=SHIPPING",
    );
    renderPage();
    await screen.findAllByText("주문번호 :");

    for (const label of [
      "배송 중",
      "배송 완료",
      "상품 준비 중",
      "입금 확인 중",
    ]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    const statusGroup = screen.getByRole("group", { name: "주문 처리 상태" });
    expect(
      within(statusGroup).getByRole("button", { name: "전체" }),
    ).toHaveAttribute("aria-pressed", "true");
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
