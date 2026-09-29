import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { apiBaseUrl: "http://localhost:9087" },
}));

import { isDemoSession, setDemoSession } from "@/lib/demo-session";

import { clientFetch } from "./client";
import { apiFetch } from "./fetcher";

beforeEach(() => sessionStorage.clear());

it("실제 모드에서는 이전 시연 세션을 복원하거나 새로 시작하지 않는다", () => {
  sessionStorage.setItem("midam:api-demo-session", "1");
  expect(isDemoSession()).toBe(false);
  setDemoSession(true);
  expect(isDemoSession()).toBe(false);
});

it("브라우저의 시연 API 요청을 네트워크 전에 차단한다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  await expect(
    clientFetch("/api/mock/purchase/orders", { method: "POST" }),
  ).rejects.toThrow("시연 기능");
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("서버의 시연 API 요청도 네트워크 전에 차단한다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  await expect(apiFetch("/api/mock/catalogue/products")).rejects.toThrow(
    "시연 기능",
  );
  expect(fetchSpy).not.toHaveBeenCalled();
});
