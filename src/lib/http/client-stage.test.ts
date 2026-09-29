import { http } from "msw";
import { afterEach, expect, it, vi } from "vitest";

import { startMockOAuthLogin } from "@/api/member/api";
import { publicEnv } from "@/lib/env";
import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { clientFetch, refreshAccessToken } from "./client";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
afterEach(() => {
  vi.unstubAllGlobals();
  Object.assign(publicEnv, { apiMocking: false });
});
function stageWindow() {
  vi.stubGlobal("window", {
    location: new URL("https://stg.midam.store/login"),
    sessionStorage: window.sessionStorage,
    dispatchEvent: window.dispatchEvent.bind(window),
  });
}
it.each([
  "/api/member/login",
  "/api/member/oauth2/exchange",
  "/api/member/oauth2/complete-profile",
  "/api/member/logout",
])("Stage %s는 쿠키를 가진 백엔드로 전송한다", async (path) => {
  stageWindow();
  server.use(
    http.post(`*${path}`, ({ request }) =>
      mockOk({ url: request.url, credentials: request.credentials }),
    ),
  );
  expect(await clientFetch(path, { method: "POST", auth: false })).toEqual({
    url: `https://api.stg.midam.store${path}`,
    credentials: "include",
  });
});
it("Stage 세션 복원도 백엔드 쿠키를 전송한다", async () => {
  stageWindow();
  let target = "";
  let credentials = "";
  server.use(
    http.post("*/api/member/token/refresh", ({ request }) => {
      target = request.url;
      credentials = request.credentials;
      return mockOk({ accessToken: "stage-token" });
    }),
  );
  await refreshAccessToken();
  expect(target).toBe("https://api.stg.midam.store/api/member/token/refresh");
  expect(credentials).toBe("include");
});
it("Stage 상품 API는 same-origin을 유지하고 목업 경로는 차단한다", async () => {
  stageWindow();
  useAuthStore.getState().clear();
  server.use(
    http.get("*/api/products", ({ request }) => mockOk(request.url)),
    http.get("*/api/mock/member/me", ({ request }) => mockOk(request.url)),
  );
  expect(await clientFetch("/api/products", { auth: false })).toBe(
    "https://stg.midam.store/api/products",
  );
  await expect(
    clientFetch("/api/mock/member/me", { auth: false }),
  ).rejects.toThrow("시연 기능");
});

it("Stage 카카오 버튼은 백엔드 시작 주소로 이동하고 성공 후 홈으로 돌아온다", async () => {
  const assign = vi.fn();
  vi.stubGlobal("window", {
    location: { origin: "https://stg.midam.store", assign },
    sessionStorage: window.sessionStorage,
    dispatchEvent: window.dispatchEvent.bind(window),
  });
  sessionStorage.setItem("oauth-return", "/cart");
  expect(await startMockOAuthLogin("kakao")).toEqual({
    outcome: "redirecting",
  });
  expect(assign).toHaveBeenCalledWith(
    "https://api.stg.midam.store/api/member/oauth2/kakao",
  );
  expect(sessionStorage.getItem("oauth-return")).toBe("/");
  expect(sessionStorage.getItem("oauth-provider")).toBe("kakao");
});

it.each([
  ["https://stg.midam.store", false, "https://api.stg.midam.store", "include"],
  ["https://stg.midam.store", true, "https://stg.midam.store", "same-origin"],
  ["https://midam.store", false, "https://midam.store", "same-origin"],
  ["http://localhost:3004", false, "http://localhost:3004", "same-origin"],
])(
  "인증 대상 경계 origin=%s mock=%s",
  async (origin, mock, target, credentials) => {
    Object.assign(publicEnv, { apiMocking: mock });
    vi.stubGlobal("window", {
      location: new URL(origin),
      sessionStorage: window.sessionStorage,
    });
    server.use(
      http.post("*/api/member/oauth2/exchange", ({ request }) =>
        mockOk({ url: request.url, credentials: request.credentials }),
      ),
    );
    expect(
      await clientFetch("/api/member/oauth2/exchange", {
        method: "POST",
        auth: false,
        credentials: "same-origin",
      }),
    ).toEqual({ url: `${target}/api/member/oauth2/exchange`, credentials });
  },
);
