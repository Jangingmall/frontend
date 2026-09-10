import { beforeEach, describe, expect, it } from "vitest";

import type { AuthUser } from "@/types/auth";

import { selectIsArtisan, selectIsAuthenticated, useAuthStore } from "./auth";

const user: AuthUser = { id: 1, name: "김미담", roles: ["USER"] };

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
});

describe("useAuthStore", () => {
  it("부팅 시점엔 loading으로 시작한다", () => {
    expect(useAuthStore.getState()).toMatchObject({
      status: "loading",
      accessToken: null,
      user: null,
    });
  });

  it("setSession은 토큰+user를 채우고 authenticated로 전환한다", () => {
    useAuthStore.getState().setSession("t1", user);

    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      accessToken: "t1",
      user: { id: 1, name: "김미담", roles: ["USER"] },
    });
  });

  it("setAccessToken은 토큰만 바꾸고 status·user를 유지한다", () => {
    useAuthStore.getState().setSession("t1", user);
    useAuthStore.getState().setAccessToken("t2");

    expect(useAuthStore.getState()).toMatchObject({
      status: "authenticated",
      accessToken: "t2",
      user: { id: 1 },
    });
  });

  it("clear는 초기화하고 anonymous로 전환한다", () => {
    useAuthStore.getState().setSession("t1", user);
    useAuthStore.getState().clear();

    expect(useAuthStore.getState()).toMatchObject({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
  });

  it("selectIsArtisan은 roles에 ARTISAN이 있을 때만 true", () => {
    expect(selectIsArtisan(useAuthStore.getState())).toBe(false);

    useAuthStore.getState().setSession("t", {
      id: 2,
      name: "이공방",
      roles: ["USER", "ARTISAN"],
    });

    expect(selectIsArtisan(useAuthStore.getState())).toBe(true);
  });

  it("selectIsAuthenticated는 status 기준", () => {
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);
    useAuthStore.getState().setSession("t", user);
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
  });
});
