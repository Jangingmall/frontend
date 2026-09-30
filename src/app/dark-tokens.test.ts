import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "globals.css"), "utf-8");

/** 최상위 `selector { ... }` 블록들의 본문을 이어붙인다(중첩 없는 파일 구조 전제). */
function blockBodies(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`, "g");
  return [...css.matchAll(re)].map((m) => m[1]).join("\n");
}

function customProperties(body: string): Set<string> {
  return new Set(
    [...body.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
  );
}

const rootTokens = customProperties(blockBodies(":root"));
const darkTokens = customProperties(blockBodies(".dark"));

/** 다크에서도 값이 같아 `.dark` 에서 다시 정의하지 않는 semantic·component 토큰(Figma dark-mode 대조 결과). */
const SAME_IN_DARK = new Set([
  "--bg-deam",
  "--fill-jade",
  "--border-white",
  "--font-label",
  "--nav-jade",
  "--icon-red-border",
  "--icon-red-fill",
  "--icon-yellow-border",
  "--icon-yellow-fill",
  "--button-black",
  "--button-jade",
  "--button-jade-weak",
  "--button-border-black",
  "--button-border-jade",
  "--progress-bar-green",
  "--progress-bar-red",
  "--progress-bar-yellow",
  "--badge-red",
  "--badge-yellow",
  "--textfield-underline",
  "--textfield-border",
  "--textfield-font-weak",
  "--textfield-border-jade",
  "--textfield-border-selected",
]);

const SEMANTIC_PREFIXES = [
  "--bg-",
  "--fill-",
  "--border-",
  "--font-",
  "--yellow-",
  "--red-",
  "--states-",
  "--nav-",
  "--icon-",
  "--button-",
  "--progress-bar-",
  "--badge-",
  "--textfield-",
];

// 프리미티브(`--red-300` 같은 숫자 접미)는 semantic 이 아니다.
const isSemantic = (name: string) =>
  SEMANTIC_PREFIXES.some((p) => name.startsWith(p)) &&
  !/^--(yellow|red)-\d+$/.test(name);

describe("다크 모드 토큰", () => {
  it("CSS 파싱이 토큰을 실제로 읽는다(빈 결과로 통과하는 것 방지)", () => {
    expect(rootTokens.size).toBeGreaterThan(60);
    expect(darkTokens.size).toBeGreaterThan(30);
  });

  it(".dark 는 :root 에 있는 토큰만 재정의한다(오타 방지)", () => {
    const unknown = [...darkTokens].filter((t) => !rootTokens.has(t));
    expect(unknown).toEqual([]);
  });

  it("semantic·component 토큰은 .dark 에서 재정의했거나 SAME_IN_DARK 에 명시돼 있다(누락 방지)", () => {
    const missing = [...rootTokens].filter(
      (t) => isSemantic(t) && !darkTokens.has(t) && !SAME_IN_DARK.has(t),
    );
    expect(missing).toEqual([]);
  });

  it("SAME_IN_DARK 와 .dark 가 겹치지 않는다", () => {
    const overlap = [...SAME_IN_DARK].filter((t) => darkTokens.has(t));
    expect(overlap).toEqual([]);
  });
});
