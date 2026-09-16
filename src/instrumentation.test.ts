import { afterEach, describe, expect, it, vi } from "vitest";

const listen = vi.fn();

vi.mock("@/mocks/server", () => ({ server: { listen } }));

/**
 * `register()`는 `publicEnv.isVercelProduction`·`NEXT_RUNTIME`에 따라 MSW node
 * 서버를 띄울지 결정한다. Vercel 실제 production 배포면 `apiMocking`이 켜져 있어도
 * 띄우지 않아야 한다(PR 리뷰 — CodeRabbit Security Review, `src/mocks/start-browser.test.ts`
 * 와 짝). 처음엔 `NODE_ENV === "production"`로 막았다가 CI E2E(의도적으로 production
 * 빌드에서 목업을 씀)까지 걸려 전부 실패한 적이 있다 — 그래서 `isVercelProduction`으로
 * 바꿨다.
 */
describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/env");
    vi.resetModules();
    listen.mockReset();
  });

  it("Vercel production이 아니고 nodejs 런타임이면 MSW 서버를 띄운다", async () => {
    vi.doMock("@/lib/env", () => ({
      publicEnv: { apiMocking: true, isVercelProduction: false },
    }));
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const { register } = await import("./instrumentation");

    await register();

    expect(listen).toHaveBeenCalledWith({ onUnhandledRequest: "bypass" });
  });

  it("Vercel production이면 apiMocking이 켜져 있어도 띄우지 않는다", async () => {
    vi.doMock("@/lib/env", () => ({
      publicEnv: { apiMocking: true, isVercelProduction: true },
    }));
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const { register } = await import("./instrumentation");

    await register();

    expect(listen).not.toHaveBeenCalled();
  });
});
