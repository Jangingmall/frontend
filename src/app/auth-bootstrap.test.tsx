import { render, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { __resetRefreshState } from "@/lib/http/client";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { AuthBootstrap } from "./auth-bootstrap";

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
  __resetRefreshState();
  localStorage.clear();
});

describe("AuthBootstrap", () => {
  it("children을 즉시 렌더한다 (렌더 비차단)", () => {
    render(<AuthBootstrap>홈</AuthBootstrap>);
    expect(screen.getByText("홈")).toBeInTheDocument();
  });

  it("로그인 이력이 있으면 refresh → me 성공으로 세션을 복원한다", async () => {
    // `api/member/mock/mock-identity.ts` — 기본값(로그인 이력 없음)이 아니라 "USER"로 로그인한
    // 적 있는 상태를 명시적으로 흉내 낸다.
    setMockIdentity("USER");

    render(<AuthBootstrap>홈</AuthBootstrap>);

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("authenticated"),
    );
    expect(useAuthStore.getState().user).toMatchObject({
      id: 1,
      role: "USER",
    });
  });

  it("로그인 이력이 없으면(기본값) anonymous로 시작한다", async () => {
    // mock-identity를 아무것도 안 건드린 순수 기본값 — `/token/refresh`가 401을 낸다
    // (2026-09-15 정정: 예전엔 이 핸들러가 무조건 성공해 새 브라우저 세션도 항상
    // authenticated로 부팅됐고, 그 상태로는 `/login`의 "이미 인증됐으면 내보낸다" 가드를
    // 테스트할 방법이 없었다 — 이 테스트가 그 회귀를 막는다).
    render(<AuthBootstrap>홈</AuthBootstrap>);

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("anonymous"),
    );
  });

  it("refresh 실패 시(로그인 이력이 있어도) anonymous로 시작한다", async () => {
    setMockIdentity("USER");
    server.use(
      http.post("*/api/member/token/refresh", () =>
        mockError(401, "TOKEN_MISMATCH"),
      ),
    );

    render(<AuthBootstrap>홈</AuthBootstrap>);

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("anonymous"),
    );
  });
});
