import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // 아키텍처 §12.1: 상위 디렉터리로 올라가는 상대 경로 import 금지 — 같은 디렉터리를
    // 벗어나는 참조는 항상 @/ 절대 경로를 사용한다. (이 규칙이 순수 문자열 매칭이라
    // 리졸버 없이도 역할 경계 규칙과 함께 크로스-롤 상대 경로 우회를 차단한다.)
    // src/ 밖(예: .storybook/, scripts/)에서 src/로 들어오는 참조는 역할 경계 대상이
    // 아니므로 제외한다.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./",
              message:
                "상위 디렉터리로 올라가는 상대 경로 import는 사용하지 않습니다. @/ 절대 경로를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated quality-tool artifacts:
    "storybook-static/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
