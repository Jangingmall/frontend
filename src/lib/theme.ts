/**
 * 다크 모드 적용. `<html class="dark">` 토글이 전부고, 색은 `globals.css` 의 `.dark` 토큰이 바꾼다.
 *
 * 결정 우선순위: 로그인 사용자 = BE `darkMode`(설정) > 비로그인 = 기기 테마(`prefers-color-scheme`).
 * `localStorage` 는 BE 값의 **캐시**일 뿐이다 — 첫 페인트 전(`themeInitScript`)에 서버 응답 없이
 * 같은 값을 미리 적용해 깜빡임을 막는다. 비로그인에는 저장값이 없다.
 */

export const THEME_STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** 저장값(`dark`|`light`)이 있으면 그 값, 없거나 알 수 없으면 기기 테마. */
export function resolveDark(stored: string | null, systemDark: boolean) {
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return systemDark;
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DARK_QUERY).matches
  );
}

function readStored() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: "dark" | "light" | null) {
  try {
    if (value === null) window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등) — 클래스 적용만으로 충분하다.
  }
}

function setDarkClass(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * 테마를 적용한다. `true`/`false` = 로그인 사용자의 명시 값(저장소에도 남김), `null` = 명시 값
 * 없음(비로그인·로그아웃) → 저장값을 지우고 기기 테마를 따른다.
 */
export function applyTheme(dark: boolean | null) {
  if (dark === null) {
    writeStored(null);
    setDarkClass(systemPrefersDark());
    return;
  }
  writeStored(dark ? "dark" : "light");
  setDarkClass(dark);
}

/**
 * 기기 테마 변경을 구독한다. 저장값이 없을 때(= 비로그인)만 클래스를 바꾼다. 해제 함수를 반환한다.
 */
export function subscribeSystemTheme() {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    if (readStored() === null) setDarkClass(query.matches);
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * `<head>` 인라인 스크립트 본문. 렌더 전에 동기 실행돼 첫 페인트 전에 `dark` 클래스를 붙인다.
 * `resolveDark` 와 같은 규칙이다(스크립트는 번들 밖이라 함수를 못 쓰고 문자열로 복제한다).
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=s==="dark"||(s!=="light"&&window.matchMedia(${JSON.stringify(DARK_QUERY)}).matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
