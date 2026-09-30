import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { resetSettingsMock } from "@/api/member/mock/handlers";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { ThemeSync } from "./theme-sync";

const isDark = () => document.documentElement.classList.contains("dark");

function stubSystemTheme(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return dark;
    },
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return {
    setDark(next: boolean) {
      dark = next;
      listeners.forEach((l) => l());
    },
  };
}

function renderSync() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeSync />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
  // 목업 로그인 이력도 localStorage 에 있어서 비운 뒤에 심는다.
  localStorage.clear();
  setMockIdentity("USER");
  resetSettingsMock();
  document.documentElement.classList.remove("dark");
});
afterEach(() => vi.unstubAllGlobals());

describe("ThemeSync", () => {
  it("부팅 복원 중(loading)에는 인라인 스크립트가 붙인 클래스를 건드리지 않는다", () => {
    stubSystemTheme(false);
    document.documentElement.classList.add("dark");

    renderSync();

    expect(isDark()).toBe(true);
  });

  it("비로그인은 기기 테마를 따르고 기기 테마 변경을 즉시 반영한다", () => {
    const system = stubSystemTheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    useAuthStore.setState({ status: "anonymous" });

    renderSync();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(isDark()).toBe(true);
    act(() => system.setDark(false));
    expect(isDark()).toBe(false);
  });

  it("로그인하면 설정의 darkMode 를 기기 테마보다 우선해 적용한다", async () => {
    stubSystemTheme(true); // 기기는 다크, 설정은 라이트(시드 기본값)
    useAuthStore.setState({
      status: "authenticated",
      accessToken: SEED_ACCESS_TOKEN,
    });

    renderSync();
    await waitFor(() =>
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light"),
    );
    expect(isDark()).toBe(false);
  });

  it("설정이 다크면 dark 를 적용하고, 로그아웃하면 기기 테마로 돌아간다", async () => {
    stubSystemTheme(false);
    server.use(
      http.get("*/api/member/settings", () =>
        mockOk({ darkMode: true, marketing: true }),
      ),
    );
    useAuthStore.setState({
      status: "authenticated",
      accessToken: SEED_ACCESS_TOKEN,
    });

    renderSync();
    await waitFor(() => expect(isDark()).toBe(true));

    act(() => useAuthStore.setState({ status: "anonymous" }));

    await waitFor(() => expect(isDark()).toBe(false));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
