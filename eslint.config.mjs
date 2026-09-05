import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// 아키텍처 §12.2: 역할별 의존성 방향. 크로스-롤 참조는 항상 @/ 절대 경로(§12.1)이므로
// import specifier 문자열 매칭으로 강제한다.
const boundary = (label, groups) => ({
  group: groups.flatMap((g) => [`@/${g}`, `@/${g}/**`]),
  message: `${label} (§12.2)`,
});

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
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/**/*.stories.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            boundary(
              "컴포넌트는 api·queries·stores·app을 참조하지 않습니다. 데이터는 화면 조합 코드가 props로 내려줍니다.",
              ["api", "queries", "stores", "app"],
            ),
          ],
        },
      ],
    },
  },
  {
    files: ["src/queries/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            boundary("queries는 app·components·stores를 참조하지 않습니다.", [
              "app",
              "components",
              "stores",
            ]),
          ],
        },
      ],
    },
  },
  {
    files: ["src/api/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            boundary(
              "api는 app·components·queries·stores를 참조하지 않습니다.",
              ["app", "components", "queries", "stores"],
            ),
          ],
        },
      ],
    },
  },
  {
    files: ["src/stores/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            boundary(
              "stores는 app·api·queries·components를 참조하지 않습니다.",
              ["app", "api", "queries", "components"],
            ),
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/lib/**/*.{ts,tsx}",
      "src/utils/**/*.{ts,tsx}",
      "src/constants/**/*.{ts,tsx}",
      "src/types/**/*.{ts,tsx}",
    ],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            boundary("공통 하위 코드는 상위 역할 코드를 참조하지 않습니다.", [
              "app",
              "api",
              "queries",
              "stores",
              "hooks",
              "mocks",
              "components",
            ]),
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
