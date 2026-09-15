import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_LOGIN } from "@/api/member/mock/fixtures";
import { __resetLoginRateLimit } from "@/api/member/mock/handlers";

import { useLoginMutation } from "./mutations";

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
