import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  resolveDark,
  subscribeSystemTheme,
  THEME_STORAGE_KEY,
  themeInitScript,
} from "./theme";

type Listener = () => void;

/** jsdom 에는 matchMedia 가 없어 기기 테마를 흉내 내는 스텁을 단다. */
function stubSystemTheme(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<Listener>();
  const mql = {
    get matches() {
      return dark;
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
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
    listenerCount: () => listeners.size,
  };
}

const isDark = () => document.documentElement.classList.contains("dark");

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterEach(() => vi.unstubAllGlobals());

describe("resolveDark", () => {
  it("저장값이 있으면 기기 테마보다 우선한다", () => {
    expect(resolveDark("dark", false)).toBe(true);
    expect(resolveDark("light", true)).toBe(false);
  });

  it("저장값이 없거나 알 수 없으면 기기 테마를 따른다", () => {
    expect(resolveDark(null, true)).toBe(true);
    expect(resolveDark(null, false)).toBe(false);
    expect(resolveDark("system", true)).toBe(true);
  });
});

describe("applyTheme", () => {
  it("true/false 는 클래스와 저장소에 반영한다", () => {
    stubSystemTheme(false);

    applyTheme(true);
    expect(isDark()).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    applyTheme(false);
    expect(isDark()).toBe(false);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("null 은 저장값을 지우고 기기 테마를 따른다", () => {
    stubSystemTheme(true);
    applyTheme(false);

    applyTheme(null);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(isDark()).toBe(true);
  });

  it("저장소를 못 써도 클래스는 적용된다", () => {
    stubSystemTheme(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    applyTheme(true);

    expect(isDark()).toBe(true);
  });
});

describe("subscribeSystemTheme", () => {
  it("저장값이 없으면 기기 테마 변경을 즉시 반영한다", () => {
    const system = stubSystemTheme(false);
    const unsubscribe = subscribeSystemTheme();

    system.setDark(true);
    expect(isDark()).toBe(true);
    system.setDark(false);
    expect(isDark()).toBe(false);

    unsubscribe();
    expect(system.listenerCount()).toBe(0);
  });

  it("저장값(로그인 사용자의 명시 값)이 있으면 기기 테마 변경을 무시한다", () => {
    const system = stubSystemTheme(false);
    applyTheme(false);
    subscribeSystemTheme();

    system.setDark(true);

    expect(isDark()).toBe(false);
  });
});

describe("themeInitScript", () => {
  const run = () => new Function(themeInitScript)();

  it("저장값 dark 면 기기 테마와 무관하게 dark 를 붙인다", () => {
    stubSystemTheme(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    run();
    expect(isDark()).toBe(true);
  });

  it("저장값 light 면 기기가 다크여도 붙이지 않는다", () => {
    stubSystemTheme(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    run();
    expect(isDark()).toBe(false);
  });

  it("저장값이 없으면 기기 테마를 따른다", () => {
    stubSystemTheme(true);
    run();
    expect(isDark()).toBe(true);
  });

  it("matchMedia 가 없어도 던지지 않는다", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(run).not.toThrow();
  });
});
