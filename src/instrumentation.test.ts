import { afterEach, describe, expect, it, vi } from "vitest";

const listen = vi.fn();

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));
vi.mock("@/mocks/server", () => ({ server: { listen } }));

/**
 * `register()`는 `NODE_ENV`·`NEXT_RUNTIME`에 따라 MSW node 서버를 띄울지 결정한다.
 * `NODE_ENV === "production"`이면 `apiMocking`이 켜져 있어도 띄우지 않아야 한다(PR
 * 리뷰 — CodeRabbit Security Review, `src/mocks/start-browser.test.ts`와 짝).
 */
describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    listen.mockReset();
  });

  it("NODE_ENV가 production이 아니고 nodejs 런타임이면 MSW 서버를 띄운다", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const { register } = await import("./instrumentation");

    await register();

    expect(listen).toHaveBeenCalledWith({ onUnhandledRequest: "bypass" });
  });

  it("NODE_ENV가 production이면 apiMocking이 켜져 있어도 띄우지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const { register } = await import("./instrumentation");

    await register();

    expect(listen).not.toHaveBeenCalled();
  });
});
