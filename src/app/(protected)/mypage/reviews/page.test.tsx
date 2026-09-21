import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MypageReviewsPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
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
  return render(<MypageReviewsPage />, { wrapper: Wrapper });
}

describe("MypageReviewsPage", () => {
  const previousUrl = window.location.href;

  beforeEach(() => {
    window.history.replaceState(null, "", "/mypage/reviews");
  });

  afterEach(() => {
    window.history.replaceState(null, "", previousUrl);
  });

  it("후기를 기다리는 상품과 내가 작성한 후기를 보여준다", async () => {
    renderPage();
    expect(
      await screen.findByText(/후기를 기다리는 상품이 \d+건 있어요/),
    ).toBeInTheDocument();
    expect(await screen.findByText("내가 작성한 후기")).toBeInTheDocument();
    expect(screen.getAllByText("백자 달항아리").length).toBeGreaterThan(0);
  });

  it("후기 작성하기를 누르면 해당 상품의 작성 모달이 뜬다", async () => {
    const user = userEvent.setup();
    renderPage();
    const writeButtons = await screen.findAllByRole("button", {
      name: "후기 작성하기",
    });
    await user.click(writeButtons[0]!);
    expect(
      await screen.findByRole("heading", { name: "후기 작성하기" }),
    ).toBeInTheDocument();
  });

  it("별점을 고르고 등록하면 모달이 닫히고 목록이 갱신된다", async () => {
    const user = userEvent.setup();
    renderPage();
    const writeButtons = await screen.findAllByRole("button", {
      name: "후기 작성하기",
    });
    const cardsBefore = writeButtons.length;
    await user.click(writeButtons[0]!);

    const dialog = await screen.findByRole("dialog");
    const stars = within(dialog).getAllByTestId(/review-rating-star-/);
    await user.click(stars[4]!);
    await user.type(
      within(dialog).getByRole("textbox", { name: "후기 본문" }),
      "정말 만족스러운 상품이었습니다.",
    );
    await user.click(within(dialog).getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(async () => {
      const remaining = await screen.findAllByRole("button", {
        name: "후기 작성하기",
      });
      expect(remaining.length).toBe(cardsBefore - 1);
    });
  });

  it("페이지네이션 클릭 시 URL에 page가 반영된다", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("내가 작성한 후기");
    await user.click(screen.getByRole("button", { name: "2 페이지" }));
    expect(new URLSearchParams(window.location.search).get("page")).toBe("2");
  });
});
