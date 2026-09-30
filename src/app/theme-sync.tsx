"use client";

import { useEffect } from "react";

import { applyTheme, subscribeSystemTheme } from "@/lib/theme";
import { useSettingsQuery } from "@/queries/member/queries";
import { useAuthStore } from "@/stores/auth";

/**
 * 앱 전역 테마 동기화. (`lib/theme.ts` 의 우선순위 규칙)
 *
 * - 로그인: 설정(`GET /api/member/settings`)의 `darkMode` 를 적용한다. 설정 화면의 낙관적
 *   업데이트가 같은 쿼리 캐시를 바꾸므로 토글도 여기서 따라 반영된다.
 * - 비로그인·로그아웃: 저장값을 지우고 기기 테마를 따른다(기기 테마가 바뀌면 즉시 반영).
 * - 부팅 복원 중(`loading`): 건드리지 않는다 — 첫 페인트 전 인라인 스크립트가 저장값으로 이미
 *   적용해 뒀다.
 */
export function ThemeSync() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== "anonymous") return;
    applyTheme(null);
    return subscribeSystemTheme();
  }, [status]);

  return status === "authenticated" ? <AuthenticatedThemeSync /> : null;
}

function AuthenticatedThemeSync() {
  const darkMode = useSettingsQuery().data?.darkMode;

  useEffect(() => {
    if (darkMode !== undefined) applyTheme(darkMode);
  }, [darkMode]);

  return null;
}
