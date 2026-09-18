import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { MypageProfileCard } from "./MypageProfileCard";

function renderCard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<MypageProfileCard />, { wrapper: Wrapper });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
});

describe("MypageProfileCard", () => {
  it("회원 이름을 보여준다", async () => {
    renderCard();

    expect(await screen.findByText("김미담님")).toBeInTheDocument();
  });

  it("조회에 실패하면 오류와 재시도 버튼을 보여주고, 재시도 버튼이 다시 조회한다", async () => {
    let requestCount = 0;
    server.use(
      http.get("*/api/member/me", () => {
        requestCount += 1;
        return mockError(500, "INTERNAL_ERROR");
      }),
    );
    const user = userEvent.setup();
    renderCard();

    expect(await screen.findByRole("alert")).toHaveTextContent(/./);
    expect(screen.queryByText("김미담님")).not.toBeInTheDocument();

    const countAfterFirstLoad = requestCount;
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() =>
      expect(requestCount).toBeGreaterThan(countAfterFirstLoad),
    );
  });
});
