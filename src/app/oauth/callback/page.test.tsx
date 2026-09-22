import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

import OAuthCallbackPage from "./page";

const { exchange, replace, router } = vi.hoisted(() => {
  const replace = vi.fn();
  return { exchange: vi.fn(), replace, router: { replace } };
});
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/api/member/oauth", () => ({ exchangeOAuthTicket: exchange }));
vi.mock("@/app/signup/_components/SignupInfoForm", () => ({
  SignupInfoForm: () => <p>추가정보 입력</p>,
}));
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("oauth-provider", "naver");
  sessionStorage.setItem("oauth-return", "/cart");
  useAuthStore.getState().clear();
});

it("온보딩의 세션 설정 이후 완료 화면 이동을 덮어쓰거나 오류로 바꾸지 않는다", async () => {
  exchange.mockResolvedValue({ outcome: "needsProfile" });
  render(
    <StrictMode>
      <OAuthCallbackPage />
    </StrictMode>,
  );
  await screen.findByText("추가정보 입력");
  act(() => {
    sessionStorage.removeItem("oauth-provider");
    useAuthStore
      .getState()
      .setSession("token", { id: 1, name: "구매자", role: "USER" });
  });
  await waitFor(() => expect(exchange).toHaveBeenCalledTimes(1));
  expect(replace).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("기존 회원의 교환 결과는 세션을 설정하고 한 번만 이동한다", async () => {
  exchange.mockResolvedValue({
    outcome: "authenticated",
    accessToken: "token",
    user: { id: 1, name: "구매자", role: "USER" },
  });
  render(
    <StrictMode>
      <OAuthCallbackPage />
    </StrictMode>,
  );
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/cart"));
  expect(exchange).toHaveBeenCalledTimes(1);
  expect(replace).toHaveBeenCalledTimes(1);
});

it("교환을 시작하지 않은 인증된 재진입은 티켓을 다시 소비하지 않는다", async () => {
  sessionStorage.removeItem("oauth-provider");
  useAuthStore
    .getState()
    .setSession("token", { id: 1, name: "구매자", role: "USER" });
  render(<OAuthCallbackPage />);
  expect(replace).toHaveBeenCalledWith("/cart");
  expect(exchange).not.toHaveBeenCalled();
});
