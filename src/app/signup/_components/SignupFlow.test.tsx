import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  memberMeUser,
  SEED_VERIFICATION_CODE,
} from "@/api/member/mock/fixtures";
import { __resetEmailVerificationState } from "@/api/member/mock/handlers";
import {
  getMockOAuthLinkedMember,
  setMockOAuthLinkedMember,
} from "@/api/member/mock/mock-identity";
import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";
import type { OAuthProvider } from "@/types/auth";

import { SignupFlow } from "./SignupFlow";

// `startMockOAuthLogin`이 `publicEnv.apiMocking`를 확인한다 — 플레인 `vitest run`은
// `.env.local`을 안 읽어 기본값이 false라, 명시적으로 켜지 않으면 소셜 버튼 클릭마다 던진다.
vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: true, tossClientKey: "" },
}));

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

function renderSignupFlow(
  returnUrl: string | null = null,
  provider: OAuthProvider | null = null,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<SignupFlow returnUrl={returnUrl} provider={provider} />, {
    wrapper: Wrapper,
  });
}

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  useAuthStore.setState({ status: "anonymous", accessToken: null, user: null });
  __resetEmailVerificationState();
});

afterEach(() => {
  Object.assign(publicEnv, { apiMocking: true });
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

  it("카카오 버튼을 처음 누르면 소셜 추가정보 입력(02단계)으로 전환하고, 이메일은 프리필·잠금된다", async () => {
    // IA: 카카오는 인증된 이메일을 제공해 인증 단계를 생략한다.
    const user = userEvent.setup();
    renderSignupFlow();

    await user.click(
      screen.getByRole("button", { name: "카카오톡으로 빠르게 가입하기" }),
    );

    expect(await screen.findByText("이름")).toBeInTheDocument();
    // 이메일 인증 절차 없이 바로 "인증 완료"에 준하는 안내가 보인다.
    expect(
      screen.getByText("제공자가 인증한 이메일이에요."),
    ).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText("example@email.com");
    expect(emailInput).toBeDisabled();
    expect((emailInput as HTMLInputElement).value).toMatch(
      /^kakao-.+@midam\.test$/,
    );
    // 소셜 모드는 비밀번호를 받지 않는다.
    expect(screen.queryByPlaceholderText("비밀번호")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("비밀번호 확인"),
    ).not.toBeInTheDocument();
  });

  it("네이버 버튼을 누르면 소셜 추가정보 입력으로 전환하되 이메일은 직접 입력·인증해야 한다", async () => {
    // IA: 네이버는 이메일을 제공하지 않는다 — 소셜 이메일 미제공 처리.
    const user = userEvent.setup();
    renderSignupFlow();

    await user.click(
      screen.getByRole("button", { name: "네이버로 빠르게 가입하기" }),
    );

    expect(await screen.findByText("이름")).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText("example@email.com");
    expect(emailInput).not.toBeDisabled();
    expect((emailInput as HTMLInputElement).value).toBe("");
    expect(
      screen.getByRole("button", { name: "인증 메일 발송" }),
    ).toBeInTheDocument();
  });

  it("카카오 소셜 추가정보를 제출하면 가입 완료 페이지로 이동하고 연동 상태가 저장된다", async () => {
    const user = userEvent.setup();
    renderSignupFlow("/products");

    await user.click(
      screen.getByRole("button", { name: "카카오톡으로 빠르게 가입하기" }),
    );
    await user.type(await screen.findByPlaceholderText("홍길동"), "김소셜");
    const [phoneMiddle, phoneLast] = screen.getAllByPlaceholderText("0000");
    await user.type(phoneMiddle, "1234");
    await user.type(phoneLast, "5678");
    await user.click(screen.getByRole("checkbox", { name: "전체 동의하기" }));

    const submitButton = screen.getByRole("button", { name: "가입하기" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    await user.click(submitButton);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        "/signup/complete?returnUrl=%2Fproducts",
      ),
    );
    // 다음에 같은 provider로 다시 시도하면 즉시 로그인되도록(§4·§7-3) 연동 상태가 저장돼야
    // 한다 — 제출 직후 이 컴포넌트는 이미 authenticated로 바뀌어 "불러오는 중" 화면으로
    // 전환되므로(실제 앱이라면 이 시점에 페이지를 떠난다), UI 재상호작용 대신 저장된 값을
    // 직접 확인한다.
    expect(getMockOAuthLinkedMember("kakao")?.name).toBe("김소셜");
  });

  it("이미 연동된 소셜 계정으로 다시 시도하면 추가정보 입력 없이 즉시 로그인된다", async () => {
    setMockOAuthLinkedMember("kakao", memberMeUser);
    const user = userEvent.setup();
    renderSignupFlow("/products");

    await user.click(
      screen.getByRole("button", { name: "카카오톡으로 빠르게 가입하기" }),
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/products"));
    // 추가정보 입력 화면으로는 전혀 넘어가지 않는다.
    expect(screen.queryByText("이름")).not.toBeInTheDocument();
  });

  it("/login에서 provider와 함께 진입하면 01단계를 건너뛰고 자동으로 목업 판정을 실행한다", async () => {
    renderSignupFlow(null, "naver");

    // 첫 렌더부터 01단계(가입 수단 선택) 자체를 그리지 않는다 — 깜빡임 방지.
    expect(
      screen.queryByRole("button", { name: "이메일,비밀번호로 가입하기" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("이름")).toBeInTheDocument();
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

  it("실제 소셜 버튼은 제공자 이동 정보를 보존하고 추가정보를 임의 생성하지 않는다", async () => {
    Object.assign(publicEnv, { apiMocking: false });
    renderSignupFlow("/cart");
    await userEvent.click(
      screen.getByRole("button", { name: "카카오톡으로 빠르게 가입하기" }),
    );
    await waitFor(() =>
      expect(sessionStorage.getItem("oauth-provider")).toBe("kakao"),
    );
    expect(screen.queryByText("이름")).not.toBeInTheDocument();
  });
});
