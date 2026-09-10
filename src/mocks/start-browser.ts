import { publicEnv } from "@/lib/env";

import { worker } from "./browser";

/**
 * 브라우저 목업 워커를 기동한다. 목업 플래그가 켜진 경우에만 동작.
 *
 * 호출부는 클라이언트 fetcher 도입 시점에 최상위 클라이언트 경계에서 연결한다
 * (렌더 전에 `await`). 그때까지는 등록만 되고 쓰이지 않는다.
 */
export async function startMockWorker(): Promise<void> {
  if (!publicEnv.apiMocking) return;
  await worker.start({ onUnhandledRequest: "bypass" });
}
