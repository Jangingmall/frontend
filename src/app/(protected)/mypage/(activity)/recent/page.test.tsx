import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RECENT_VIEW_FIXTURES } from "@/api/recent-views/mock/fixtures";
import { WISH_FIXTURES } from "@/api/wishlist/mock/fixtures";

import MypageRecentPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const SEED_RECENT_VIEW_FIXTURES = structuredClone(RECENT_VIEW_FIXTURES);
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
  return render(<MypageRecentPage />, { wrapper: Wrapper });
}

describe("MypageRecentPage", () => {
  const previousUrl = window.location.href;

  beforeEach(() => {
    window.history.replaceState(null, "", "/mypage/recent");
    RECENT_VIEW_FIXTURES.length = 0;
    RECENT_VIEW_FIXTURES.push(...structuredClone(SEED_RECENT_VIEW_FIXTURES));
    WISH_FIXTURES.length = 0;
    WISH_FIXTURES.push(...structuredClone(SEED_WISH_FIXTURES));
  });

  afterEach(() => {
    window.history.replaceState(null, "", previousUrl);
  });

  it("최근 본 상품을 카드 그리드로 보여준다", async () => {
    renderPage();
    expect(await screen.findByText("놋그릇 5첩 반상기")).toBeInTheDocument();
  });

  it("찜 안 된 상품의 하트를 누르면 추가되고 안내가 뜬다", async () => {
    const user = userEvent.setup();
    renderPage();
    // 109는 찜 목록 시드에 없는 최근 본 상품 — 처음엔 빈 하트.
    const heart = await screen.findByRole("button", {
      name: "놋그릇 5첩 반상기 찜하기",
    });
    await user.click(heart);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "놋그릇 5첩 반상기 찜 취소" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("찜 목록에 추가했습니다.")).toBeInTheDocument();
  });

  it("이미 찜된 상품의 하트를 누르면 해제되고 안내가 뜬다", async () => {
    const user = userEvent.setup();
    renderPage();
    // 101은 찜 목록 시드에도 있는 최근 본 상품 — 처음부터 채워진 하트.
    const heart = await screen.findByRole("button", {
      name: "백자 달항아리 찜 취소",
    });
    await user.click(heart);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "백자 달항아리 찜하기" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("찜 목록에서 삭제되었습니다.")).toBeInTheDocument();
  });
});
