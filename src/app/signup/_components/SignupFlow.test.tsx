import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_VERIFICATION_CODE } from "@/api/member/mock/fixtures";
import { __resetEmailVerificationState } from "@/api/member/mock/handlers";
import { useAuthStore } from "@/stores/auth";

import { SignupFlow } from "./SignupFlow";

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

function renderSignupFlow(returnUrl: string | null = null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<SignupFlow returnUrl={returnUrl} />, { wrapper: Wrapper });
}

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  useAuthStore.setState({ status: "anonymous", accessToken: null, user: null });
  __resetEmailVerificationState();
});

describe("SignupFlow", () => {
  it("기본으로 01단계(가입 수단 선택)를 보여준다", () => {
    renderSignupFlow();

    expect(
      screen.getByRole("button", { name: "이메일,비밀번호로 가입하기" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("이름")).not.toBeInTheDocument();
  });

  it("이메일 가입 선택 시 02단계(정보 입력) 폼으로 전환한다", async () => {
    const user = userEvent.setup();
    renderSignupFlow();

    await user.click(
      screen.getByRole("button", { name: "이메일,비밀번호로 가입하기" }),
    );

    expect(screen.getByText("이름")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "이메일,비밀번호로 가입하기" }),
    ).not.toBeInTheDocument();
  });

  it("이미 인증된 사용자는 01단계에서도 즉시 리다이렉트된다(가드가 스텝 오케스트레이터 레벨)", async () => {
    // 가드를 SignupInfoForm(02단계) 안에만 두면 01단계는 가드 없이 그대로 보이는 구멍이
    // 있었다(design.md §1 리뷰에서 발견) — 회귀 방지 테스트.
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "김미담", role: "USER" },
    });

    renderSignupFlow("/products");

    expect(
      screen.queryByRole("button", { name: "이메일,비밀번호로 가입하기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/products"));
  });

  it("이미 인증된 상태에서 returnUrl이 없으면 /로 보낸다", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "김미담", role: "USER" },
    });

    renderSignupFlow(null);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("status가 loading이면 폼 대신 로딩을 보여준다", () => {
    useAuthStore.setState({ status: "loading", accessToken: null, user: null });

    renderSignupFlow();

    expect(
      screen.queryByRole("button", { name: "이메일,비밀번호로 가입하기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("네이버·카카오 가입 버튼은 둘 다 비활성이다", () => {
    renderSignupFlow();

    expect(
      screen.getByRole("button", { name: "네이버로 가입 (준비 중)" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "카카오로 가입 (준비 중)" }),
    ).toBeDisabled();
  });

  it("가입 성공 시 /signup/complete로 이동한다 — 가드가 자기 자신을 덮어쓰지 않는다", async () => {
    // 실제 브라우저로 돌려보다 발견한 회귀: SignupInfoForm 하나만 렌더하는 테스트로는 못
    // 잡힌다 — SignupFlow의 "이미 인증된 사용자 가드"가 가입 성공 직후 setSession()으로
    // status가 authenticated로 바뀌는 걸 보고 먼저 "/"로 리다이렉트해 onSubmit의
    // "/signup/complete"행 이동을 덮어쓰는 문제였다(SignupFlow.tsx 주석 참고).
    const user = userEvent.setup();
    renderSignupFlow("/products");

    await user.click(
      screen.getByRole("button", { name: "이메일,비밀번호로 가입하기" }),
    );
    await user.type(screen.getByPlaceholderText("홍길동"), "홍길동");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "flow-newbie@midam.test",
    );
    await user.type(screen.getByPlaceholderText("비밀번호"), "Abcd1234!");
    await user.type(screen.getByPlaceholderText("비밀번호 확인"), "Abcd1234!");
    const [phoneMiddle, phoneLast] = screen.getAllByPlaceholderText("0000");
    await user.type(phoneMiddle, "1234");
    await user.type(phoneLast, "5678");

    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));
    await user.type(
      await screen.findByPlaceholderText("인증코드를 입력해주세요"),
      SEED_VERIFICATION_CODE,
    );
    await user.click(screen.getByRole("button", { name: "인증 확인" }));
    await user.click(screen.getByRole("checkbox", { name: "전체 동의하기" }));

    const submitButton = screen.getByRole("button", { name: "가입하기" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/signup/complete?returnUrl=%2Fproducts",
      ),
    );
    // 가드가 끼어들었다면 이렇게 "/products"로 replace가 불렸을 것이다.
    expect(replace).not.toHaveBeenCalled();
  });
});
