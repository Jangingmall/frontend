import { beforeEach, describe, expect, it } from "vitest";

import { __resetRefreshState } from "@/lib/http/client";
import { useAuthStore } from "@/stores/auth";

import { fetchMe, login, logout, refreshToken } from "./api";
import {
  SEED_ACCESS_TOKEN,
  SEED_ACCESS_TOKEN_REFRESHED,
  SEED_LOGIN,
} from "./mock/fixtures";

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
  __resetRefreshState();
});

describe("member api", () => {
  it("login: 유효 자격 → accessToken", async () => {
    await expect(login(SEED_LOGIN)).resolves.toMatchObject({
      accessToken: SEED_ACCESS_TOKEN,
    });
  });

  it("login: 잘못된 자격 → ApiError 401", async () => {
    await expect(
      login({ email: "wrong@midam.test", password: "nope" }),
    ).rejects.toMatchObject({ name: "ApiError", status: 401 });
  });

  it("login: 필드 누락 → ApiError 400", async () => {
    await expect(login({ email: "", password: "" })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
    });
  });

  it("fetchMe: 유효 토큰이면 사용자", async () => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
    await expect(fetchMe()).resolves.toEqual({
      id: 1,
      name: "김미담",
      roles: ["USER"],
    });
  });

  it("refreshToken: 새 accessToken", async () => {
    await expect(refreshToken()).resolves.toMatchObject({
      accessToken: SEED_ACCESS_TOKEN_REFRESHED,
    });
  });

  it("logout: 성공적으로 완료된다", async () => {
    await expect(logout()).resolves.toBeUndefined();
  });
});
