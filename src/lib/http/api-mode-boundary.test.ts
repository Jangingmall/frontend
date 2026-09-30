import { http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { apiBaseUrl: "http://localhost:9087" },
}));
import { isDemoSession, setDemoSession } from "@/lib/demo-session";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { clientFetch } from "./client";
import { apiFetch } from "./fetcher";
import { setServerMockResolver } from "./server-mock";

beforeEach(() => {
  sessionStorage.clear();
  setServerMockResolver(async () => undefined);
});
it("API 모드는 시연 로그인 세션을 활성화하지 않는다", () => {
  setDemoSession(true);
  expect(isDemoSession()).toBe(false);
  setDemoSession(false);
  expect(isDemoSession()).toBe(false);
});
it("브라우저는 명시적인 시연 경로의 응답을 읽는다", async () => {
  server.use(
    http.get("*/api/mock/purchase/benefits", () => mockOk({ demo: true })),
  );
  await expect(
    clientFetch("/api/mock/purchase/benefits", { auth: false }),
  ).resolves.toEqual({ demo: true });
});
it("실제 API 500 응답을 시연 성공으로 바꾸지 않는다", async () => {
  server.use(
    http.get("*/api/products", () => mockError(500, "INTERNAL_SERVER_ERROR")),
  );
  await expect(
    clientFetch("/api/products", { auth: false }),
  ).rejects.toMatchObject({ status: 500 });
});
it("SSR 시연 요청은 등록된 MSW resolver에서 처리한다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  setServerMockResolver(async (request) =>
    new URL(request.url).pathname === "/api/mock/purchase/benefits"
      ? mockOk({ demo: true })
      : undefined,
  );
  try {
    await expect(apiFetch("/api/mock/purchase/benefits")).resolves.toEqual({
      demo: true,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    setServerMockResolver(async () => undefined);
  }
});
