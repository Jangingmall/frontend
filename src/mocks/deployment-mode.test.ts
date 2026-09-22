import { afterEach, expect, it, vi } from "vitest";

const { start, listen } = vi.hoisted(() => ({
  start: vi.fn(),
  listen: vi.fn(),
}));
vi.mock("./browser", () => ({ worker: { start } }));
vi.mock("./server", () => ({ server: { listen } }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

it.each([
  ["production", "enabled", "enabled", true],
  ["production", "enabled", "", false],
  ["production", "", "enabled", false],
  ["", "", "", false],
  ["", "enabled", "", true],
  ["preview", "enabled", "", true],
])(
  "배포=%s MSW=%s 허용=%s에서 서버와 브라우저 기동=%s",
  async (environment, mocking, allow, enabled) => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", environment);
    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", mocking);
    vi.stubEnv("NEXT_PUBLIC_ALLOW_PRODUCTION_MOCK", allow);
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const { register } = await import("../instrumentation");
    const { startMockWorker } = await import("./start-browser");
    await register();
    await startMockWorker();
    expect(listen).toHaveBeenCalledTimes(enabled ? 1 : 0);
    expect(start).toHaveBeenCalledTimes(enabled ? 1 : 0);
  },
);
