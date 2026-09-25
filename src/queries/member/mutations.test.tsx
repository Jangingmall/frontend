import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SEED_ACCESS_TOKEN,
  SEED_LOGIN,
  SEED_VERIFICATION_CODE,
} from "@/api/member/mock/fixtures";
import {
  __resetEmailVerificationState,
  __resetLoginRateLimit,
  resetAddressMock,
  resetSettingsMock,
} from "@/api/member/mock/handlers";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { memberKeys } from "./keys";
import {
  useChangePasswordMutation,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useLoginMutation,
  useRequestEmailVerificationMutation,
  useSignupMutation,
  useUpdateAddressMutation,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
  useVerifyEmailCodeMutation,
  useVerifyPasswordMutation,
} from "./mutations";

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function createWrapper(client: QueryClient = createClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  __resetLoginRateLimit();
  __resetEmailVerificationState();
  resetAddressMock();
  resetSettingsMock();
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
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

describe("useUpdateProfileMutation", () => {
  it("성공: 갱신된 프로필을 반환하고 profile 쿼리를 무효화한다", async () => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
    const client = createClient();
    client.setQueryData(memberKeys.profile(), { name: "이전이름" });

    const { result } = renderHook(() => useUpdateProfileMutation(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ name: "새이름", phone: "01099998888" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ name: "새이름" });
    expect(client.getQueryState(memberKeys.profile())?.isInvalidated).toBe(
      true,
    );
  });
});

describe("useChangePasswordMutation", () => {
  it("성공: 현재 비밀번호가 맞으면 완료된다", async () => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
    const { result } = renderHook(() => useChangePasswordMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      currentPassword: SEED_LOGIN.password,
      newPassword: "NewPassw0rd!",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("실패: 현재 비밀번호가 틀리면 ApiError 400 MISMATCH", async () => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
    const { result } = renderHook(() => useChangePasswordMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      currentPassword: "wrong",
      newPassword: "NewPassw0rd!",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      status: 400,
      code: "MISMATCH",
    });
  });
});

describe("useVerifyPasswordMutation", () => {
  it("올바른 비밀번호면 true를 반환한다", async () => {
    const { result } = renderHook(() => useVerifyPasswordMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: SEED_LOGIN.email,
      password: SEED_LOGIN.password,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(true);
  });

  it("틀린 비밀번호면 false를 반환한다(에러 아님)", async () => {
    const { result } = renderHook(() => useVerifyPasswordMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: SEED_LOGIN.email, password: "wrong" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(false);
  });
});

describe("배송지 mutation", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  });

  it("useCreateAddressMutation: 성공 시 배송지를 생성하고 목록을 무효화한다", async () => {
    const client = createClient();
    client.setQueryData(memberKeys.addresses(), []);

    const { result } = renderHook(() => useCreateAddressMutation(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({
      recipientName: "홍길동",
      phone: "01055556666",
      zipCode: "12345",
      address1: "서울특별시 종로구 세종대로 1",
      address2: "1층",
      isDefault: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ recipientName: "홍길동" });
    expect(client.getQueryState(memberKeys.addresses())?.isInvalidated).toBe(
      true,
    );
  });

  it("useUpdateAddressMutation: 존재하지 않는 id면 ApiError 404", async () => {
    const { result } = renderHook(() => useUpdateAddressMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ addressId: 999999, input: { address2: "x" } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 404 });
  });

  it("useDeleteAddressMutation: 성공 시 목록을 무효화한다", async () => {
    const client = createClient();
    client.setQueryData(memberKeys.addresses(), []);
    const { result: fetchResult } = renderHook(
      () => useCreateAddressMutation(),
      { wrapper: createWrapper(client) },
    );
    fetchResult.current.mutate({
      recipientName: "홍길동",
      phone: "01055556666",
      zipCode: "12345",
      address1: "서울특별시 종로구 세종대로 1",
      address2: "1층",
      isDefault: true,
    });
    await waitFor(() => expect(fetchResult.current.isSuccess).toBe(true));
    const createdId = fetchResult.current.data!.id;

    const { result } = renderHook(() => useDeleteAddressMutation(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate(createdId);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(memberKeys.addresses())?.isInvalidated).toBe(
      true,
    );
  });
});

describe("useUpdateSettingsMutation", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  });

  it("성공: 낙관적으로 즉시 반영되고 서버 응답으로 확정된다", async () => {
    const client = createClient();
    client.setQueryData(memberKeys.settings(), {
      darkMode: false,
      marketing: true,
    });

    const { result } = renderHook(() => useUpdateSettingsMutation(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ darkMode: true });

    await waitFor(() =>
      expect(client.getQueryData(memberKeys.settings())).toEqual({
        darkMode: true,
        marketing: true,
      }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(memberKeys.settings())?.isInvalidated).toBe(
      true,
    );
  });

  it("실패: 저장이 실패하면 이전 값으로 롤백한다", async () => {
    server.use(
      http.patch("*/api/member/settings", () =>
        mockError(500, "INTERNAL_ERROR"),
      ),
    );
    const client = createClient();
    client.setQueryData(memberKeys.settings(), {
      darkMode: false,
      marketing: true,
    });

    const { result } = renderHook(() => useUpdateSettingsMutation(), {
      wrapper: createWrapper(client),
    });
    result.current.mutate({ darkMode: true });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData(memberKeys.settings())).toEqual({
      darkMode: false,
      marketing: true,
    });
  });
});

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));
