import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_LOGIN, SEED_VERIFICATION_CODE } from "@/api/member/mock/fixtures";
import {
  __resetEmailVerificationState,
  __resetLoginRateLimit,
} from "@/api/member/mock/handlers";

import {
  useLoginMutation,
  useRequestEmailVerificationMutation,
  useSignupMutation,
  useVerifyEmailCodeMutation,
} from "./mutations";

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  __resetLoginRateLimit();
  __resetEmailVerificationState();
});

describe("useLoginMutation", () => {
  it("성공: accessToken + user를 한 번의 호출로 반환한다", async () => {
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(SEED_LOGIN);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      accessToken: "mock-access-token",
      user: { id: 1, name: "김미담", role: "USER" },
    });
  });

  it("실패: 잘못된 자격이면 ApiError로 실패한다", async () => {
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: "wrong@midam.test", password: "nope" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      name: "ApiError",
      status: 401,
    });
  });
});

describe("useSignupMutation", () => {
  it("이메일 인증 완료 후 가입하면 세션을 반환한다", async () => {
    const email = "newbie@midam.test";
    const { result: verificationResult } = renderHook(
      () => useRequestEmailVerificationMutation(),
      { wrapper: createWrapper() },
    );
    verificationResult.current.mutate({ email });
    await waitFor(() =>
      expect(verificationResult.current.isSuccess).toBe(true),
    );

    const { result: verifyResult } = renderHook(
      () => useVerifyEmailCodeMutation(),
      { wrapper: createWrapper() },
    );
    verifyResult.current.mutate({ email, code: SEED_VERIFICATION_CODE });
    await waitFor(() => expect(verifyResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useSignupMutation(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      email,
      password: "Abcd1234!",
      passwordConfirm: "Abcd1234!",
      name: "홍길동",
      phone: "01012345678",
      role: "USER",
      agreements: {
        age14OrOlder: true,
        termsOfService: true,
        privacyCollection: true,
        marketing: false,
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user).toMatchObject({ name: "홍길동" });
  });
});
