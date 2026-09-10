import { publicEnv } from "@/lib/env";

let started = false;

/**
 * 브라우저 목업 워커를 기동한다. 목업 플래그가 켜진 경우에만 동작.
 *
 * 호출부는 `src/app/auth-bootstrap.tsx` — 부팅 시 첫 클라이언트 `/api/*` 요청(silent refresh)
 * 전에 `await`한다. 최상위 클라이언트 경계라 앱 전체가 그 뒤에 이어진다.
 *
 * `./browser`는 동적 import한다 — `setupWorker`가 모듈 로드 즉시 브라우저 환경을 요구해
 * (jsdom·Node에서 throw) 정적 import하면 이 모듈을 거치는 테스트가 깨진다.
 * 멱등: StrictMode 이중 마운트·리마운트에도 `worker.start()`는 한 번만 부른다.
 */
export async function startMockWorker(): Promise<void> {
  if (started || !publicEnv.apiMocking) return;
  started = true;
  const { worker } = await import("./browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}
