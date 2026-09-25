import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_LOGIN, SEED_VERIFICATION_CODE } from "@/api/member/mock/fixtures";
import { __resetEmailVerificationState } from "@/api/member/mock/handlers";
import { publicEnv } from "@/lib/env";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { SignupInfoForm, type SocialSignupContext } from "./SignupInfoForm";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));
const push = vi.fn();
const onCancel = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderSignupInfoForm(
  returnUrl: string | null = null,
  socialContext: SocialSignupContext | null = null,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(
    <SignupInfoForm
      returnUrl={returnUrl}
      onCancel={onCancel}
      socialContext={socialContext}
    />,
    { wrapper: Wrapper },
  );
}

async function fillEmail(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
) {
  await user.type(screen.getByPlaceholderText("example@email.com"), email);
}

async function fillBaseFields(
  user: ReturnType<typeof userEvent.setup>,
  name = "홍길동",
) {
  await user.type(screen.getByPlaceholderText("홍길동"), name);
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
  Object.assign(publicEnv, { apiMocking: true });
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

  it("인증 메일 발송이 실패했다가 재시도로 성공하면 이전 폼 에러가 사라진다", async () => {
    // 리뷰(F3) — 첫 발송이 5xx로 실패해 `formError`가 뜬 뒤, 같은 버튼으로 재시도해 성공해도
    // 그 에러가 안 지워져서 "코드 입력 가능한 정상 상태"인데도 실패 안내가 남아 있었다.
    // `{ once: true }`라 첫 호출만 가로채고, 재시도는 handlers.ts의 기본(성공) 핸들러로
    // 자연스럽게 폴백한다.
    server.use(
      http.post(
        "*/api/member/email-verifications",
        () => mockError(500, "INTERNAL_ERROR", "일시적 오류"),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderSignupInfoForm();

    await fillEmail(user, "newbie@midam.test");
    const verifyButton = screen.getByRole("button", { name: "인증 메일 발송" });
    await user.click(verifyButton);
    await screen.findByRole("alert");

    await user.click(verifyButton);

    await screen.findByPlaceholderText("인증코드를 입력해주세요");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("이름이 공백만이면 제출 시 필수값 에러를 보여주고 제출되지 않는다", async () => {
    // 리뷰(F4) — 이름 정규식이 `\s`를 포함하고 길이도 원본 문자열 기준이라 "   "처럼 공백만
    // 2자 이상인 값도 유효했다. `z.string().trim()`으로 앞뒤 공백을 먼저 지우게 고쳤다.
    const user = userEvent.setup();
    renderSignupInfoForm();

    await fillBaseFields(user, "   ");
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

    expect(await screen.findByText("이름을 입력해주세요.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
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

    const errorText = await screen.findByText("이미 가입된 이메일이에요.");
    // 텍스트만 보면 폼 상단 `formError`로 회귀해도 같은 문구라 통과해버린다 — 실제로
    // 이메일 필드에 연결됐는지는 `aria-describedby`로 확인해야 한다(리뷰 nit). 이 시점엔
    // 인증 완료로 이메일 input이 `disabled`라 base-ui가 `aria-invalid`는 일부러 안 붙인다
    // (`useFieldValidation.js`: `!state.disabled && !disabled`) — `aria-describedby`는
    // disabled 여부와 무관하게 항상 연결되므로 이쪽이 신뢰할 수 있는 신호다.
    const emailInput = screen.getByPlaceholderText("example@email.com");
    expect(emailInput.getAttribute("aria-describedby")).toBe(errorText.id);
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

  it("socialContext(이메일 제공)면 비밀번호 필드 없이 이메일이 잠긴 채로 프리필된다", () => {
    renderSignupInfoForm(null, {
      provider: "kakao",
      suggestedEmail: "kakao-user@midam.test",
    });

    const emailInput = screen.getByPlaceholderText("example@email.com");
    expect(emailInput).toBeDisabled();
    expect((emailInput as HTMLInputElement).value).toBe(
      "kakao-user@midam.test",
    );
    expect(screen.queryByPlaceholderText("비밀번호")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "인증 메일 발송" }),
    ).not.toBeInTheDocument();
  });

  it("socialContext(이메일 미제공)면 비밀번호 없이 이메일 입력·인증이 그대로 필요하다", () => {
    renderSignupInfoForm(null, { provider: "naver", suggestedEmail: null });

    const emailInput = screen.getByPlaceholderText("example@email.com");
    expect(emailInput).not.toBeDisabled();
    expect(screen.queryByPlaceholderText("비밀번호")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "인증 메일 발송" }),
    ).toBeInTheDocument();
  });
});
it.each([true, false])(
  "실제 코드 인증 후 가입하며 자동 로그인 성공=%s",
  async (loginSucceeds) => {
    Object.assign(publicEnv, { apiMocking: false });
    const member = {
      memberId: 99,
      email: "newbie@midam.test",
      name: "홍길동",
      nickname: null,
      role: "USER",
      profileImageUrl: null,
      provider: null,
      phone: null,
    };
    const signupCall = vi.fn();
    server.use(
      http.post("*/api/member/email/verification-code", () => mockOk(null)),
      http.post("*/api/member/email/verify", () => mockOk(null)),
      http.post("*/api/member/signup", () => {
        signupCall();
        return mockOk({ accessToken: null, member });
      }),
      http.post("*/api/member/login", (): Response =>
        loginSucceeds
          ? mockOk({ accessToken: "live-session", member })
          : mockError(503, "INTERNAL_ERROR"),
      ),
    );
    renderSignupInfoForm("/cart");
    const user = userEvent.setup();
    await fillBaseFields(user);
    await agreeAllTerms(user);
    expect(screen.getByRole("button", { name: "가입하기" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "인증 메일 발송" }));
    expect(await screen.findByText("05:00 남음")).toBeVisible();
    await user.type(
      screen.getByPlaceholderText("인증코드를 입력해주세요"),
      "123456",
    );
    await user.click(screen.getByRole("button", { name: "인증 확인" }));
    await screen.findByText("인증 완료");
    await user.click(screen.getByRole("button", { name: "가입하기" }));
    if (loginSucceeds) {
      await waitFor(() =>
        expect(push).toHaveBeenCalledWith("/signup/complete?returnUrl=%2Fcart"),
      );
      expect(useAuthStore.getState().accessToken).toBe("live-session");
    } else {
      expect(
        await screen.findByRole("link", { name: "로그인하기" }),
      ).toHaveAttribute("href", "/login?returnUrl=%2Fcart");
      expect(screen.getByRole("button", { name: "가입하기" })).toBeDisabled();
      expect(useAuthStore.getState().status).toBe("anonymous");
    }
    expect(signupCall).toHaveBeenCalledOnce();
  },
);
it("live social completion clears its consumed ticket marker before authentication", async () => {
  Object.assign(publicEnv, { apiMocking: false });
  sessionStorage.setItem("oauth-provider", "naver");
  server.use(
    http.post("*/api/member/oauth2/complete-profile", () =>
      mockOk({
        accessToken: "session",
        memberId: 99,
        email: "buyer@example.com",
        role: "USER",
        provider: "naver",
      }),
    ),
  );
  renderSignupInfoForm("/cart", { provider: "naver", suggestedEmail: null });
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("홍길동"), "홍길동");
  const [middle, last] = screen.getAllByPlaceholderText("0000");
  await user.type(middle, "1234");
  await user.type(last, "5678");
  await agreeAllTerms(user);
  await user.click(screen.getByRole("button", { name: "가입하기" }));
  await waitFor(() =>
    expect(useAuthStore.getState().status).toBe("authenticated"),
  );
  expect(sessionStorage.getItem("oauth-provider")).toBeNull();
});
