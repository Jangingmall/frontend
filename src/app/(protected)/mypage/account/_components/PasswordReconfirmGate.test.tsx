import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { memberMeUser, SEED_LOGIN } from "@/api/member/mock/fixtures";
import { __resetLoginRateLimit } from "@/api/member/mock/handlers";
import {
  __clearMockOAuthLinkedMembers,
  setMockOAuthLinkedMember,
} from "@/api/member/mock/mock-identity";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { PasswordReconfirmGate } from "./PasswordReconfirmGate";

// `startMockOAuthLogin`이 `publicEnv.apiMocking`을 확인한다 — 플레인 `vitest run`은
// `.env.local`을 안 읽으므로 명시적으로 켠다(SignupFlow.test.tsx와 동일 패턴).
vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: true, tossClientKey: "" },
}));

function renderGate(props: Parameters<typeof PasswordReconfirmGate>[0]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<PasswordReconfirmGate {...props} />, { wrapper: Wrapper });
}

beforeEach(() => {
  __resetLoginRateLimit();
  __clearMockOAuthLinkedMembers();
  localStorage.clear();
});

describe("PasswordReconfirmGate", () => {
  it("LOCAL: 올바른 비밀번호면 onVerified를 호출한다", async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    renderGate({ email: SEED_LOGIN.email, authProvider: "local", onVerified });

    await user.type(
      screen.getByPlaceholderText("비밀번호"),
      SEED_LOGIN.password,
    );
    await user.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() => expect(onVerified).toHaveBeenCalled());
  });

  it("LOCAL: 틀린 비밀번호면 인라인 에러를 보여주고 onVerified를 호출하지 않는다", async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    renderGate({ email: SEED_LOGIN.email, authProvider: "local", onVerified });

    await user.type(screen.getByPlaceholderText("비밀번호"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "확인" }));

    expect(
      await screen.findByText("비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("LOCAL: 서버 오류(5xx)는 필드 오류가 아니라 폼 레벨 알림으로 보여준다", async () => {
    server.use(
      http.post("*/api/member/login", () => mockError(500, "INTERNAL_ERROR")),
    );
    const user = userEvent.setup();
    const onVerified = vi.fn();
    renderGate({ email: SEED_LOGIN.email, authProvider: "local", onVerified });

    await user.type(screen.getByPlaceholderText("비밀번호"), "아무값");
    await user.click(screen.getByRole("button", { name: "확인" }));

    const alert = await screen.findByRole("alert");
    expect(alert).not.toHaveTextContent("비밀번호가 일치하지 않습니다.");
    expect(
      screen.queryByText("비밀번호가 일치하지 않습니다."),
    ).not.toBeInTheDocument();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it("소셜(NAVER/KAKAO): provider 버튼을 눌러 재로그인하면 onVerified를 호출한다", async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    setMockOAuthLinkedMember("kakao", memberMeUser);
    renderGate({
      email: SEED_LOGIN.email,
      authProvider: "kakao",
      onVerified,
    });

    await user.click(
      screen.getByRole("button", { name: "카카오로 다시 로그인" }),
    );

    await waitFor(() => expect(onVerified).toHaveBeenCalled());
  });

  it("소셜: 연동 정보가 없으면 에러를 보여준다", async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    renderGate({
      email: SEED_LOGIN.email,
      authProvider: "naver",
      onVerified,
    });

    await user.click(
      screen.getByRole("button", { name: "네이버로 다시 로그인" }),
    );

    expect(
      await screen.findByText(
        "연동 정보를 확인하지 못했어요. 다시 로그인해주세요.",
      ),
    ).toBeInTheDocument();
    expect(onVerified).not.toHaveBeenCalled();
  });
});
