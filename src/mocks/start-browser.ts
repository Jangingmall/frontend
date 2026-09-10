import { publicEnv } from "@/lib/env";

import { worker } from "./browser";

/**
 * 브라우저 목업 워커를 기동한다. 목업 플래그가 켜진 경우에만 동작.
 *
 * 현재 이 함수의 호출부는 **의도적으로 없다.** 브라우저에서 `/api/*` 를 호출하는
 * 클라이언트 fetcher가 아직 없어(후속 작업) 워커가 가로챌 대상이 없고, 호출 위치도
 * "첫 클라이언트 요청 전에 `await` 완료" 를 보장해야 해서 클라이언트 fetcher·
 * QueryProvider 구조와 함께 잡는다. 그때 최상위 클라이언트 경계에서 연결한다.
 * 그때까지 이 모듈은 스크립트(`public/mockServiceWorker.js`)와 기동 함수만 준비해 둔다.
 */
export async function startMockWorker(): Promise<void> {
  if (!publicEnv.apiMocking) return;
  await worker.start({ onUnhandledRequest: "bypass" });
}
