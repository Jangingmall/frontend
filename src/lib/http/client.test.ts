import { type DefaultBodyType, delay, http, type PathParams } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import { __resetRefreshState, clientFetch } from "./client";

const REFRESHED = "mock-access-token-refreshed";

/** 성공·실패 봉투를 함께 반환하는 핸들러의 응답 body 제네릭. */
type Envelope = ApiResponse<unknown> | ApiErrorResponse;

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
  __resetRefreshState();
});

describe("clientFetch — 인증 헤더", () => {
  it("store에 토큰이 있으면 Bearer로 주입한다", async () => {
    server.use(
      http.get("*/api/echo", ({ request }) =>
        mockOk({ authorization: request.headers.get("Authorization") }),
      ),
    );
    useAuthStore.setState({ accessToken: "tok-1" });

    await expect(clientFetch("/api/echo")).resolves.toEqual({
      authorization: "Bearer tok-1",
    });
  });

  it("토큰이 없으면 헤더를 생략한다", async () => {
    server.use(
      http.get("*/api/echo", ({ request }) =>
        mockOk({ authorization: request.headers.get("Authorization") }),
      ),
    );

    await expect(clientFetch("/api/echo")).resolves.toEqual({
      authorization: null,
    });
  });

  it("auth:false면 토큰이 있어도 주입하지 않고 401이어도 refresh하지 않는다", async () => {
    let refreshCalls = 0;
    server.use(
      http.post("*/api/member/token/refresh", () => {
        refreshCalls += 1;
        return mockOk({ accessToken: REFRESHED });
      }),
      http.get("*/api/echo", () => mockError(401, "UNAUTHORIZED")),
    );
    useAuthStore.setState({ accessToken: "tok-1" });

    await expect(
      clientFetch("/api/echo", { auth: false }),
    ).rejects.toMatchObject({ name: "ApiError", status: 401 });
    expect(refreshCalls).toBe(0);
  });

  it("same-origin '/api' 밖 경로는 요청 전에 거부한다", async () => {
    useAuthStore.setState({ accessToken: "tok-1" });

    await expect(
      clientFetch("https://evil.example.com/api/steal"),
    ).rejects.toThrow(/same-origin/);
    await expect(clientFetch("//evil.example.com/x")).rejects.toThrow(
      /same-origin/,
    );
    await expect(clientFetch("/not-api/x")).rejects.toThrow(/same-origin/);
  });

  it("객체 body를 JSON 직렬화하고 Content-Type을 붙인다", async () => {
    server.use(
      http.post("*/api/echo", async ({ request }) =>
        mockOk({
          body: await request.json(),
          contentType: request.headers.get("Content-Type"),
        }),
      ),
    );

    await expect(
      clientFetch("/api/echo", { method: "POST", body: { a: 1 }, auth: false }),
    ).resolves.toEqual({ body: { a: 1 }, contentType: "application/json" });
  });
});

describe("clientFetch — 401 refresh", () => {
  it("401 → refresh → 새 토큰으로 원요청 1회 재시도", async () => {
    // `GET /me`는 Bearer mock-access-token* 가 아니면 401. refresh는 REFRESHED를 준다.
    useAuthStore.setState({ accessToken: "stale" });

    await expect(clientFetch("/api/member/me")).resolves.toMatchObject({
      id: 1,
    });
    expect(useAuthStore.getState().accessToken).toBe(REFRESHED);
  });

  it("동시 다발 401은 refresh 요청 하나로 수렴한다 (single-flight)", async () => {
    let refreshCalls = 0;
    server.use(
      http.post("*/api/member/token/refresh", async () => {
        refreshCalls += 1;
        await delay(20);
        return mockOk({ accessToken: REFRESHED });
      }),
    );
    useAuthStore.setState({ accessToken: "stale" });

    const results = await Promise.all([
      clientFetch("/api/member/me"),
      clientFetch("/api/member/me"),
      clientFetch("/api/member/me"),
    ]);

    expect(refreshCalls).toBe(1);
    for (const result of results) expect(result).toMatchObject({ id: 1 });
  });

  it("refresh 실패 → store.clear() + ApiError 전파", async () => {
    server.use(
      http.post("*/api/member/token/refresh", () =>
        mockError(401, "TOKEN_MISMATCH"),
      ),
    );
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "stale",
      user: { id: 1, name: "n", roles: ["USER"] },
    });

    await expect(clientFetch("/api/member/me")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    });
    expect(useAuthStore.getState()).toMatchObject({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
  });

  it("지연된 401: 다른 요청이 이미 토큰을 갱신했으면 refresh 없이 새 토큰으로 재시도", async () => {
    let refreshCalls = 0;
    const meAuthHeaders: (string | null)[] = [];
    let signalFirstRequest!: () => void;
    const firstRequestSent = new Promise<void>((resolve) => {
      signalFirstRequest = resolve;
    });
    server.use(
      http.post("*/api/member/token/refresh", () => {
        refreshCalls += 1;
        return mockOk({ accessToken: "should-not-be-used" });
      }),
      http.get<PathParams, DefaultBodyType, Envelope>(
        "*/api/member/me",
        async ({ request }) => {
          meAuthHeaders.push(request.headers.get("Authorization"));
          if (meAuthHeaders.length === 1) {
            signalFirstRequest();
            await delay(50); // 그 사이 store 토큰이 교체된다
            return mockError(401, "TOKEN_EXPIRED");
          }
          return mockOk({ id: 1, name: "김미담", roles: ["USER"] });
        },
      ),
    );
    useAuthStore.setState({ accessToken: "stale-T1" });

    const pending = clientFetch("/api/member/me");
    await firstRequestSent;
    useAuthStore.getState().setAccessToken("fresh-T2"); // 다른 요청이 갱신했다고 가정

    await expect(pending).resolves.toMatchObject({ id: 1 });
    expect(refreshCalls).toBe(0);
    expect(meAuthHeaders).toEqual(["Bearer stale-T1", "Bearer fresh-T2"]);
  });

  it("refresh 응답의 accessToken이 문자열이 아니면 store.clear() + 에러 전파", async () => {
    server.use(
      http.post("*/api/member/token/refresh", () =>
        mockOk({ accessToken: 123 }),
      ),
    );
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "stale",
      user: { id: 1, name: "n", roles: ["USER"] },
    });

    await expect(clientFetch("/api/member/me")).rejects.toMatchObject({
      name: "ApiError",
    });
    expect(useAuthStore.getState()).toMatchObject({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
  });

  it("비-401 에러는 refresh 없이 그대로 전파한다", async () => {
    let refreshCalls = 0;
    server.use(
      http.post("*/api/member/token/refresh", () => {
        refreshCalls += 1;
        return mockOk({ accessToken: REFRESHED });
      }),
      http.get("*/api/boom", () => mockError(500, "INTERNAL_ERROR")),
    );

    await expect(clientFetch("/api/boom")).rejects.toMatchObject({
      status: 500,
      code: "INTERNAL_ERROR",
    });
    expect(refreshCalls).toBe(0);
  });
});
