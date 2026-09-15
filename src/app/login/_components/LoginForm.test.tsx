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

  it("returnUrl 없이 로그인하면 /mypage가 아니라 /로 이동한다", async () => {
    // /mypage가 아직 라우트가 없어(T-20+ 미착수) 문서 기본값("/mypage")을 그대로 쓰면 404다
    // (Codex 리뷰 F1, review.md).
    const user = userEvent.setup();
    renderLoginForm(null);

    await user.type(
      screen.getByPlaceholderText("이메일을 입력해주세요."),
      SEED_LOGIN.email,
    );
    await user.type(
      screen.getByPlaceholderText("비밀번호를 입력해주세요."),
      SEED_LOGIN.password,
    );
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
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
    // 방금 로그인 성공으로 status가 "authenticated"로 바뀌어 있다 — 리마운트 폼은 그
    // 상태를 보고 즉시 밖으로 내보낸다(새 가드, 아래 별도 테스트로 커버). 여기서 보려는 건
    // "아이디 저장"의 순수 localStorage prefill이라 로그아웃한 새 세션을 흉내 낸다.
    useAuthStore.setState({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
    renderLoginForm();

    expect(
      screen.getByPlaceholderText<HTMLInputElement>("이메일을 입력해주세요.")
        .value,
    ).toBe(SEED_LOGIN.email);
    expect(screen.getByRole("checkbox", { name: "아이디 저장" })).toBeChecked();
  });

  it("이미 인증된 상태면 폼 대신 로딩을 보여주고 홈으로 리다이렉트한다", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "김미담", role: "USER" },
    });

    renderLoginForm("/products");

    expect(
      screen.queryByPlaceholderText("이메일을 입력해주세요."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    // /mypage가 아직 없어 로그인 성공(onSubmit) 때와 달리 fallback을 "/"로 명시한다 —
    // returnUrl("/products")이 안전한 내부 경로면 그쪽이 우선.
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/products"));
  });

  it("이미 인증된 상태에서 returnUrl이 없으면 /mypage가 아니라 /로 보낸다", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "김미담", role: "USER" },
    });

    renderLoginForm(null);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("returnUrl이 /login을 가리키면(자기참조) /로 보낸다 — 이미 인증된 상태", async () => {
    // `safeReturnUrl`은 "/login"도 내부 경로라 그대로 통과시킨다 — `resolveLoginRedirectTarget`가
    // 이 경우만 "/"로 덮어써서 로그인 화면으로 되돌아가는 무의미한 리다이렉트를 막는다.
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "김미담", role: "USER" },
    });

    renderLoginForm("/login?returnUrl=%2Fproducts");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("returnUrl이 /login을 가리키면(자기참조) /로 보낸다 — 로그인 성공", async () => {
    const user = userEvent.setup();
    renderLoginForm("/login");

    await user.type(
      screen.getByPlaceholderText("이메일을 입력해주세요."),
      SEED_LOGIN.email,
    );
    await user.type(
      screen.getByPlaceholderText("비밀번호를 입력해주세요."),
      SEED_LOGIN.password,
    );
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("status가 loading이면 폼 대신 로딩을 보여준다", () => {
    useAuthStore.setState({ status: "loading", accessToken: null, user: null });

    renderLoginForm();

    expect(
      screen.queryByPlaceholderText("이메일을 입력해주세요."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
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
