import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { resetSettingsMock } from "@/api/member/mock/handlers";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { useAuthStore } from "@/stores/auth";

import MypageSettingsPage from "./page";

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<MypageSettingsPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
  resetSettingsMock();
});

describe("MypageSettingsPage", () => {
  it("설정 화면을 렌더한다", async () => {
    renderPage();

    expect(await screen.findByText("화면 설정")).toBeInTheDocument();
    expect(screen.getByText("알림 설정")).toBeInTheDocument();
  });
});
