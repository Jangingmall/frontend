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
});
