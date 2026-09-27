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

  // "주문 취소" 필터 탭 버튼도 같은 접근성 이름을 써서(`aria-pressed`를 가짐) 카드
  // 액션 버튼(`aria-pressed` 없음)과 구분해야 한다.
  async function clickCardCancelButton() {
    const buttons = await screen.findAllByRole("button", {
      name: "주문 취소",
    });
    const actionButton = buttons.find(
      (button) => !button.hasAttribute("aria-pressed"),
    )!;
    await userEvent.setup().click(actionButton);
  }

  it("입금 확인 중 주문의 주문 취소 버튼을 누르면 취소 요청 모달이 뜬다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("주문번호 :");
    await user.click(screen.getByRole("button", { name: "입금 확인 중" }));
    await clickCardCancelButton();
    expect(
      screen.getByRole("heading", { name: "주문 취소 요청" }),
    ).toBeInTheDocument();
  });

  it("취소 사유를 고르고 등록하면 모달이 닫힌다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("주문번호 :");
    await user.click(screen.getByRole("button", { name: "입금 확인 중" }));
    await clickCardCancelButton();
    await user.click(screen.getByRole("combobox", { name: "취소 사유" }));
    await user.click(await screen.findByRole("option", { name: "단순 변심" }));
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "주문 취소 요청" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("배송 완료 주문의 후기 작성 버튼을 누르면 후기 작성 모달이 뜬다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("주문번호 :");
    await user.click(screen.getByRole("button", { name: "배송 완료" }));
    const writeButtons = await screen.findAllByRole("button", {
      name: "후기 작성",
    });
    await user.click(writeButtons[0]!);
    expect(
      screen.getByRole("heading", { name: "후기 작성하기" }),
    ).toBeInTheDocument();
  });
});

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));
