import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import MypageDefaultLayout from "./layout";

let pathname = "/mypage/reviews";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

function renderLayout() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(
    <MypageDefaultLayout>
      <p>콘텐츠</p>
    </MypageDefaultLayout>,
    { wrapper: Wrapper },
  );
}

describe("MypageDefaultLayout", () => {
  it("/mypage/orders는 콘텐츠 폭 cap을 풀어준다", () => {
    pathname = "/mypage/orders";
    renderLayout();
    const content = screen.getByText("콘텐츠").parentElement;
    expect(content).toHaveClass("max-w-none");
    expect(content).not.toHaveClass("max-w-165");
  });

  it("다른 마이페이지 라우트는 기존 폭 cap을 유지한다", () => {
    pathname = "/mypage/reviews";
    renderLayout();
    const content = screen.getByText("콘텐츠").parentElement;
    expect(content).toHaveClass("max-w-165");
  });
});
