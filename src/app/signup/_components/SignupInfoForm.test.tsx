import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_LOGIN, SEED_VERIFICATION_CODE } from "@/api/member/mock/fixtures";
import { __resetEmailVerificationState } from "@/api/member/mock/handlers";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { SignupInfoForm } from "./SignupInfoForm";

const push = vi.fn();
const onCancel = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderSignupInfoForm(returnUrl: string | null = null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<SignupInfoForm returnUrl={returnUrl} onCancel={onCancel} />, {
    wrapper: Wrapper,
  });
}

async function fillEmail(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
) {
  await user.type(screen.getByPlaceholderText("example@email.com"), email);
}

async function fillBaseFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("홍길동"), "홍길동");
  await fillEmail(user, "newbie@midam.test");
  await user.type(screen.getByPlaceholderText("비밀번호"), "Abcd1234!");
  await user.type(screen.getByPlaceholderText("비밀번호 확인"), "Abcd1234!");
  const [phoneMiddle, phoneLast] = screen.getAllByPlaceholderText("0000");
  await user.type(phoneMiddle, "1234");
  await user.type(phoneLast, "5678");
}

async function agreeAllTerms(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("checkbox", { name: "전체 동의하기" }));
}

beforeEach(() => {
  push.mockClear();
  onCancel.mockClear();
  useAuthStore.setState({ status: "anonymous", accessToken: null, user: null });
  __resetEmailVerificationState();
});

describe("SignupInfoForm", () => {
  it("이메일 인증 전에는 가입하기 버튼이 비활성이다", () => {
    renderSignupInfoForm();

    expect(screen.getByRole("button", { name: "가입하기" })).toBeDisabled();
  });

  it("취소 버튼 클릭 시 onCancel을 호출한다(01단계로 복귀)", async () => {
    const user = userEvent.setup();
    renderSignupInfoForm();

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("빈 이메일로 인증 메일 발송을 누르면 필수값 에러를 보여준다", async () => {
    const user = userEvent.setup();
    renderSignupInfoForm();

    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));

    expect(
      await screen.findByText("이메일을 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("이미 가입된 이메일이면 인증 메일 발송 단계에서 막는다", async () => {
    const user = userEvent.setup();
    renderSignupInfoForm();

    await fillEmail(user, SEED_LOGIN.email);
    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));

    expect(
      await screen.findByText("이미 가입된 이메일이에요."),
    ).toBeInTheDocument();
  });

  it("서버가 준 인증 유효시간(expiresInSeconds)으로 카운트다운한다", async () => {
    // 리뷰(F1) — 예전엔 서버 응답을 무시하고 600초로 고정했다. mock이 우연히 같은 600을
    // 반환해서 안 잡혔던 버그라, 일부러 다른 값(90초)을 줘서 그 값이 그대로 쓰이는지 본다.
    server.use(
      http.post("*/api/member/email-verifications", () =>
        mockOk({ expiresInSeconds: 90 }),
      ),
    );
    const user = userEvent.setup();
    renderSignupInfoForm();

    await fillEmail(user, "newbie@midam.test");
    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));

    expect(await screen.findByText("01:30 남음")).toBeInTheDocument();
    expect(screen.queryByText("10:00 남음")).not.toBeInTheDocument();
  });

  it("가입 제출 시 CONFLICT면 이메일 필드 에러로 보여준다", async () => {
    // 리뷰(F2) — 인증 메일 발송 단계의 CONFLICT는 이메일 필드로 매핑되는데, 최종 제출 단계는
    // 폼 상단 일반 에러로만 나와서 어떤 입력을 고쳐야 하는지 알기 어려웠다.
    server.use(
      http.post("*/api/member/signup", () =>
        mockError(409, "CONFLICT", "이미 가입된 이메일이에요."),
      ),
    );
    const user = userEvent.setup();
    renderSignupInfoForm();

    await fillBaseFields(user);
    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));
    await user.type(
      await screen.findByPlaceholderText("인증코드를 입력해주세요"),
      SEED_VERIFICATION_CODE,
    );
    await user.click(screen.getByRole("button", { name: "인증 확인" }));
    await agreeAllTerms(user);

    const submitButton = screen.getByRole("button", { name: "가입하기" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    expect(
      await screen.findByText("이미 가입된 이메일이에요."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("잘못된 인증코드면 에러를 보여주고 인증 완료로 넘어가지 않는다", async () => {
    const user = userEvent.setup();
    renderSignupInfoForm();

    await fillEmail(user, "newbie@midam.test");
    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));
    await user.type(
      await screen.findByPlaceholderText("인증코드를 입력해주세요"),
      "000000",
    );
    await user.click(screen.getByRole("button", { name: "인증 확인" }));

    expect(
      await screen.findByText("인증코드가 올바르지 않아요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가입하기" })).toBeDisabled();
  });

  it("전체 동의하기 체크 시 필수·선택 항목이 모두 체크된다", async () => {
    const user = userEvent.setup();
    renderSignupInfoForm();

    await agreeAllTerms(user);

    expect(
      screen.getByRole("checkbox", { name: "만 14세 이상입니다. (필수)" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: "마케팅 정보 수신 동의 (선택)",
      }),
    ).toBeChecked();
  });

  it("이메일 인증부터 가입 성공까지 전체 흐름을 완료하면 세션을 만들고 완료 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    renderSignupInfoForm("/products");

    await fillBaseFields(user);

    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));
    await user.type(
      await screen.findByPlaceholderText("인증코드를 입력해주세요"),
      SEED_VERIFICATION_CODE,
    );
    await user.click(screen.getByRole("button", { name: "인증 확인" }));
    expect(await screen.findByText("인증 완료")).toBeInTheDocument();

    await agreeAllTerms(user);

    const submitButton = screen.getByRole("button", { name: "가입하기" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("authenticated"),
    );
    expect(useAuthStore.getState().user).toMatchObject({ name: "홍길동" });
    expect(push).toHaveBeenCalledWith("/signup/complete?returnUrl=%2Fproducts");
  });

  it("returnUrl 없이 가입을 완료하면 쿼리스트링 없는 완료 화면으로 이동한다", async () => {
    const user = userEvent.setup();
    renderSignupInfoForm(null);

    await fillBaseFields(user);
    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));
    await user.type(
      await screen.findByPlaceholderText("인증코드를 입력해주세요"),
      SEED_VERIFICATION_CODE,
    );
    await user.click(screen.getByRole("button", { name: "인증 확인" }));
    await agreeAllTerms(user);

    const submitButton = screen.getByRole("button", { name: "가입하기" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/signup/complete"));
  });
});
