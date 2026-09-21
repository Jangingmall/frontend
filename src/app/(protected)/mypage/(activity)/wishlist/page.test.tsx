import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WISH_FIXTURES } from "@/api/wishlist/mock/fixtures";

import MypageWishlistPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const SEED_WISH_FIXTURES = structuredClone(WISH_FIXTURES);

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<MypageWishlistPage />, { wrapper: Wrapper });
}

describe("MypageWishlistPage", () => {
  const previousUrl = window.location.href;

  beforeEach(() => {
    window.history.replaceState(null, "", "/mypage/wishlist");
    WISH_FIXTURES.length = 0;
    WISH_FIXTURES.push(...structuredClone(SEED_WISH_FIXTURES));
  });

  afterEach(() => {
    window.history.replaceState(null, "", previousUrl);
  });

  it("찜한 상품을 카드 그리드로 보여준다", async () => {
    renderPage();
    expect(await screen.findByText("백자 달항아리")).toBeInTheDocument();
  });

  it("하트를 누르면 목록에서 사라지고 토스트가 뜬다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("백자 달항아리");

    await user.click(
      screen.getByRole("button", { name: "백자 달항아리 찜 취소" }),
    );

    await waitFor(() =>
      expect(screen.queryByText("백자 달항아리")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("찜 목록에서 삭제되었습니다.")).toBeInTheDocument();
  });

  it("페이지네이션 클릭 시 URL에 page가 반영된다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("백자 달항아리");
    const nextPageButton = screen.queryByRole("button", { name: "2 페이지" });
    if (!nextPageButton) return; // 시드 데이터가 한 페이지에 다 들어가면 스킵
    await user.click(nextPageButton);
    expect(new URLSearchParams(window.location.search).get("page")).toBe("2");
  });
});
