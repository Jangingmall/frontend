import { render, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { __resetRefreshState } from "@/lib/http/client";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { AuthBootstrap } from "./auth-bootstrap";

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
  __resetRefreshState();
});

describe("AuthBootstrap", () => {
  it("children을 즉시 렌더한다 (렌더 비차단)", () => {
    render(<AuthBootstrap>홈</AuthBootstrap>);
    expect(screen.getByText("홈")).toBeInTheDocument();
  });

  it("refresh → me 성공 시 세션을 복원한다", async () => {
    render(<AuthBootstrap>홈</AuthBootstrap>);

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("authenticated"),
    );
    expect(useAuthStore.getState().user).toMatchObject({
      id: 1,
      roles: ["USER"],
    });
  });

  it("refresh 실패 시 anonymous로 시작한다", async () => {
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
