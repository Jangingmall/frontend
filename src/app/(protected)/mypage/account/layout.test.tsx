import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_ACCESS_TOKEN, SEED_LOGIN } from "@/api/member/mock/fixtures";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { useAuthStore } from "@/stores/auth";

import MypageAccountLayout from "./layout";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("tab=info"),
  useRouter: () => ({ back: vi.fn() }),
  usePathname: () => "/mypage/account",
}));

function renderLayout() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(
    <MypageAccountLayout>
      <p>회원정보 콘텐츠</p>
    </MypageAccountLayout>,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
});

describe("MypageAccountLayout", () => {
  it("비밀번호 재확인 게이트를 통과해야 children이 보인다", async () => {
    const user = userEvent.setup();
    renderLayout();

    expect(
      await screen.findByRole("button", { name: "확인" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("회원정보 콘텐츠")).not.toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("비밀번호"),
      SEED_LOGIN.password,
    );
    await user.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() =>
      expect(screen.getByText("회원정보 콘텐츠")).toBeInTheDocument(),
    );
  });
});
