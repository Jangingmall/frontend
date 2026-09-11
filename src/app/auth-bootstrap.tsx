"use client";

import { type ReactNode, useEffect } from "react";

import { fetchMe, refreshToken } from "@/api/member/api";
import { startMockWorker } from "@/mocks/start-browser";
import { useAuthStore } from "@/stores/auth";

/**
 * 부팅 silent refresh. (docs/routing-and-auth.md §4.2)
 *
 * 마운트 시 `refresh()` → `GET /me`를 1회 시도한다. 성공하면 세션을 복원하고, 실패하면
 * 비로그인으로 시작한다. **렌더를 막지 않는다** — children은 즉시 그리고, 공개 페이지는
 * `status`가 `loading`이어도 보인다. 보호 라우트만 `(protected)` layout이 로딩을 막는다.
 *
 * refresh 호출은 여기(부팅 1회) + 이후 401 트리거(`lib/http/client`)로만 일어난다.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        // 목업 모드: 첫 /api 요청 전에 워커를 세운다. 플래그 off면 즉시 no-op.
        await startMockWorker();

        const { accessToken } = await refreshToken();
        if (cancelled) return;
        // 새 토큰을 store에 먼저 반영해야 이어지는 `GET /me`가 Bearer로 나간다.
        useAuthStore.getState().setAccessToken(accessToken);

        const user = await fetchMe();
        if (cancelled) return;
        useAuthStore.getState().setSession(accessToken, user);
      } catch {
        if (!cancelled) useAuthStore.getState().clear();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
