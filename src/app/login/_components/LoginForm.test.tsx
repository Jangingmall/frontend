import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login } from "@/api/member/api";
import { SEED_LOGIN } from "@/api/member/mock/fixtures";
import { __resetLoginRateLimit } from "@/api/member/mock/handlers";
import { useAuthStore } from "@/stores/auth";

import { LoginForm } from "./LoginForm";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

function renderLoginForm(returnUrl: string | null = null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<LoginForm returnUrl={returnUrl} />, { wrapper: Wrapper });
}

beforeEach(() => {
  replace.mockClear();
  useAuthStore.setState({ status: "anonymous", accessToken: null, user: null });
  __resetLoginRateLimit();
  localStorage.clear();
});

describe("LoginForm", () => {
  it("빈 값으로 제출하면 필수값 에러를 보여준다", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("이메일을 입력해주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("비밀번호를 입력해주세요.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("유효한 자격으로 로그인하면 세션을 저장하고 returnUrl로 이동한다", async () => {
    const user = userEvent.setup();
    renderLoginForm("/products");

    await user.type(
      screen.getByPlaceholderText("이메일을 입력해주세요."),
      SEED_LOGIN.email,
    );
    await user.type(
      screen.getByPlaceholderText("비밀번호를 입력해주세요."),
      SEED_LOGIN.password,
    );
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("authenticated"),
    );
    expect(useAuthStore.getState().user).toEqual({
      id: 1,
      name: "김미담",
      role: "USER",
    });
    expect(replace).toHaveBeenCalledWith("/products");
  });

  it("잘못된 자격이면 IA 확정 카피를 보여준다", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(
      screen.getByPlaceholderText("이메일을 입력해주세요."),
      "wrong@midam.test",
    );
    await user.type(
      screen.getByPlaceholderText("비밀번호를 입력해주세요."),
      "wrongpass",
    );
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("아이디 또는 비밀번호를 확인해주세요!"),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("요청 한도 초과(429)면 공통 fallback 문구를 보여준다", async () => {
    const user = userEvent.setup();

    // rate limit mock은 성공/실패 구분 없이 10회부터 429 — 폼 렌더 전에 한도를 채운다.
    for (let i = 0; i < 10; i += 1) {
      await login({ email: "x@x.com", password: "x" }).catch(() => undefined);
    }
    renderLoginForm();

    await user.type(
      screen.getByPlaceholderText("이메일을 입력해주세요."),
      SEED_LOGIN.email,
    );
    await user.type(
      screen.getByPlaceholderText("비밀번호를 입력해주세요."),
      SEED_LOGIN.password,
    );
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByText("요청이 많아요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("「아이디 저장」 체크 시 localStorage에 저장하고 리마운트 시 prefill한다", async () => {
    const user = userEvent.setup();
    const { unmount } = renderLoginForm();

    await user.type(
      screen.getByPlaceholderText("이메일을 입력해주세요."),
      SEED_LOGIN.email,
    );
    await user.type(
      screen.getByPlaceholderText("비밀번호를 입력해주세요."),
      SEED_LOGIN.password,
    );
    await user.click(screen.getByRole("checkbox", { name: "아이디 저장" }));
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() =>
      expect(localStorage.getItem("midam:rememberedEmail")).toBe(
        SEED_LOGIN.email,
      ),
    );

    unmount();
    renderLoginForm();

    expect(
      screen.getByPlaceholderText<HTMLInputElement>("이메일을 입력해주세요.")
        .value,
    ).toBe(SEED_LOGIN.email);
    expect(screen.getByRole("checkbox", { name: "아이디 저장" })).toBeChecked();
  });

  it("카카오·네이버 버튼은 둘 다 비활성이다", () => {
    renderLoginForm();

    expect(
      screen.getByRole("button", { name: "카카오로 로그인 (준비 중)" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "네이버로 로그인 (준비 중)" }),
    ).toBeDisabled();
  });
});
