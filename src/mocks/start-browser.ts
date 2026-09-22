import { publicEnv } from "@/lib/env";

let startPromise: Promise<void> | null = null;

/**
 * 브라우저 목업 워커를 기동한다. 목업 플래그가 켜진 경우에만 동작.
 *
 * 호출부는 `src/app/auth-bootstrap.tsx` — 부팅 시 첫 클라이언트 `/api/*` 요청(silent refresh)
 * 전에 `await`한다. 최상위 클라이언트 경계라 앱 전체가 그 뒤에 이어진다.
 *
 * `./browser`는 동적 import한다 — `setupWorker`가 모듈 로드 즉시 브라우저 환경을 요구해
 * (jsdom·Node에서 throw) 정적 import하면 이 모듈을 거치는 테스트가 깨진다.
 *
 * **single-flight**: 진행 중인 기동이 있으면 그 Promise를 공유한다. StrictMode의 effect
 * 재마운트로 호출이 겹쳐도 모든 호출자가 "워커 등록 완료"를 함께 기다린다(boolean 가드는
 * `worker.start()` 완료 전에 두 번째 호출을 즉시 resolve시켜 첫 요청이 인터셉트를 놓친다).
 * 실패하면 상태를 되돌려 다음 호출이 재시도할 수 있게 한다.
 *
 * Vercel 실제 production 배포(`publicEnv.isVercelProduction`)면 플래그가 켜져 있어도
 * 띄우지 않는다 — `src/instrumentation.ts`(서버 쪽 게이트)와 동일한 이유(PR 리뷰 —
 * CodeRabbit Security Review). 배포 환경 변수에 실수로 목업 플래그가 남아 있어도
 * 브라우저에서 임의 mock 신원(예: ADMIN)을 얻을 수 없게 한다. `NODE_ENV === "production"`
 * 으로 먼저 막았다가 CI E2E(의도적으로 production 빌드에서 목업을 씀)까지 걸려 전부
 * 실패한 적이 있다 — "빌드 모드"가 아니라 "어디에 떠 있는가"로 판단해야 한다.
 */
export function startMockWorker(): Promise<void> {
  if (!publicEnv.apiMocking || publicEnv.isVercelProduction) {
    return Promise.resolve();
  }
  startPromise ??= (async () => {
    const { worker } = await import("./browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  })().catch((error: unknown) => {
    startPromise = null;
    throw error;
  });
  return startPromise;
}
