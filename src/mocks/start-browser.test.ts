import { beforeEach, describe, expect, it, vi } from "vitest";

const start = vi.fn<() => Promise<void>>();

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));
vi.mock("./browser", () => ({ worker: { start } }));

describe("startMockWorker", () => {
  beforeEach(() => {
    vi.resetModules(); // 모듈 스코프 startPromise를 테스트마다 초기화
    start.mockReset();
  });

  it("동시 호출이 worker.start를 한 번만 부르고 완료를 함께 기다린다", async () => {
    let resolveStart!: () => void;
    start.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveStart = resolve;
      }),
    );
    const { startMockWorker } = await import("./start-browser");

    let firstResolved = false;
    const p1 = startMockWorker().then(() => {
      firstResolved = true;
    });
    const p2 = startMockWorker();

    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1));
    // worker.start가 아직 끝나지 않았으면 어느 호출도 resolve되지 않는다
    expect(firstResolved).toBe(false);

    resolveStart();
    await Promise.all([p1, p2]);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("기동 실패 시 상태를 되돌려 다음 호출이 재시도한다", async () => {
    start.mockRejectedValueOnce(new Error("register failed"));
    start.mockResolvedValueOnce(undefined);
    const { startMockWorker } = await import("./start-browser");

    await expect(startMockWorker()).rejects.toThrow("register failed");
    await expect(startMockWorker()).resolves.toBeUndefined();
    expect(start).toHaveBeenCalledTimes(2);
  });

  it("Vercel production이면 apiMocking이 켜져 있어도 워커를 띄우지 않는다(PR 리뷰 — 보안)", async () => {
    // 처음엔 `NODE_ENV === "production"`로 막았다가 CI E2E(의도적으로 production
    // 빌드에서 목업을 씀)까지 걸려 전부 실패한 적이 있다 — `publicEnv.isVercelProduction`
    // (Vercel 실제 배포에서만 참)으로 바꿨다.
    vi.doMock("@/lib/env", () => ({
      publicEnv: { apiMocking: true, isVercelProduction: true },
    }));
    const { startMockWorker } = await import("./start-browser");

    await expect(startMockWorker()).resolves.toBeUndefined();

    expect(start).not.toHaveBeenCalled();
    vi.doUnmock("@/lib/env");
  });
});
