# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Deliver a clean, testable Next.js frontend foundation in the Jangingmall team repository.

**Architecture:** A Next.js App Router application lives in src and keeps browser REST state behind one TanStack Query provider, domain API modules, and a shared native-fetch wrapper. Environment validation, MSW, and delivery tooling have explicit ownership boundaries. No product, order, seller, payment, or authentication implementation is created.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, Day.js, MSW, Vitest, Storybook, Playwright, ESLint, Prettier, GitHub Actions.

**Spec:** docs/superpowers/specs/2026-09-02-frontend-foundation-design.md

## Global Constraints

- Keep the Jangingmall/frontend clone, its .git directory, and its origin remote.
- Use npm and commit package-lock.json.
- Pin TypeScript 7.0.2, Next.js 16.3.3, Tailwind CSS 4.3.3, shadcn/ui 4, @tanstack/react-query 5.102.6, and Zustand 5.0.15 exactly.
- Stop and report an unavailable exact version or peer conflict; never silently substitute a version.
- Use App Router, Turbopack, src, and @/*; do not introduce Vite.
- Install Zustand, but do not create src/stores or a store without a defined cross-route UI-state requirement.
- Do not install Immer, Motion, or the Toss Payments SDK.
- Browser-readable configuration starts with NEXT_PUBLIC_; server secrets never reach a client component.
- Vercel is the deployment target; this work does not link an account or create a project.

## File Structure

~~~text
src/
  app/                  # routes, layout, metadata, query provider
  api/                  # REST calls, DTO validation, mappers
  assets/fonts/         # supplied Pretendard files
  components/common/    # domain-independent shared UI
  components/ui/        # shadcn/ui-derived components
  constants/
  e2e/
  hooks/
  lib/http/             # ApiError and fetcher
  lib/env.ts            # Zod environment validation
  mocks/                # MSW setup
  queries/
  test/
  types/
  utils/
.storybook/
.github/workflows/
scripts/
~~~

### Task 1: Bootstrap the exact App Router baseline

**Files:**
- Create: package.json, package-lock.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, .gitignore, components.json
- Create: src/app/layout.tsx, src/app/page.tsx, src/app/globals.css, src/lib/utils.ts, public/
- Create: .gitkeep files in src/api, src/assets/fonts, src/components/common, src/constants, src/hooks, src/queries, src/types, and src/utils
- Modify: README.md

**Interfaces:**
- Produces: a src-rooted App Router project with @/* imports and no Zustand store.

- [ ] **Step 1: Verify the clone before writing application files.**

~~~powershell
git remote -v
git status --short
~~~

Expected: origin is Jangingmall/frontend and only approved docs may be present.

- [ ] **Step 2: Generate an exact temporary Next.js project without Git.**

~~~powershell
npx create-next-app@16.3.3 frontend-bootstrap --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-npm --no-git --yes
~~~

Expected: frontend-bootstrap exists with no .git directory.

- [ ] **Step 3: Copy generated src, public, and root configuration files into the clone.**

Preserve .git, README.md, and docs/. Delete the verified temporary bootstrap directory after copying.

- [ ] **Step 4: Pin requested versions and install remaining runtime dependencies.**

~~~powershell
npm install --save-exact next@16.3.3 typescript@7.0.2 tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 @tanstack/react-query@5.102.6 zustand@5.0.15
npm install @hookform/resolvers browser-image-compression dayjs react-hook-form sharp zod
npx shadcn@4 init --defaults
~~~

Expected: package.json and package-lock.json retain each exact requested version.

- [ ] **Step 5: Create architecture-boundary .gitkeep files and read the installed Next.js App Router guidance required by AGENTS.md.**

~~~powershell
Get-ChildItem node_modules/next/dist/docs -Recurse -Filter *.md | Select-Object -First 10 -ExpandProperty FullName
~~~

Do not create a domain component, API, type, or Zustand store.

- [ ] **Step 6: Verify and commit the baseline.**

~~~powershell
npm run lint
npx tsc --noEmit
npm run build
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs components.json .gitignore public src README.md
git commit -m "chore: initialize frontend foundation"
~~~

Expected: all checks pass and the baseline is committed.

### Task 2: Add test-first HTTP and environment infrastructure

**Files:**
- Create: src/lib/http/api-error.ts, src/lib/http/fetcher.ts, src/lib/http/fetcher.test.ts
- Create: src/lib/env.ts, src/lib/env.test.ts, src/test/setup.ts, scripts/validate-env.ts, vitest.config.ts, .env.example
- Modify: package.json, package-lock.json

**Interfaces:**
- Produces: fetcher<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T | undefined>.
- Produces: ApiError(status: number, body: unknown).
- Produces: validateEnvironment(environment: NodeJS.ProcessEnv).

- [ ] **Step 1: Install Vitest dependencies and add test scripts.**

~~~powershell
npm install -D @testing-library/jest-dom @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom tsx vitest
~~~

Add test as vitest run, test:watch as vitest, typecheck as tsc --noEmit, and validate:env as tsx scripts/validate-env.ts. Configure Vitest with jsdom, @ mapped to src, and setup importing @testing-library/jest-dom/vitest plus cleanup.

- [ ] **Step 2: Write the failing fetcher test.**

Create src/lib/http/fetcher.test.ts:

~~~ts
import { expect, it, vi } from "vitest";
import { fetcher } from "./fetcher";

it("parses successful JSON and normalizes HTTP errors", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ message: "Invalid request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    }),
  ));

  await expect(fetcher("/products")).rejects.toMatchObject({
    status: 400,
    body: { message: "Invalid request" },
  });
});
~~~

- [ ] **Step 3: Confirm the missing-module failure.**

~~~powershell
npm run test -- src/lib/http/fetcher.test.ts
~~~

Expected: FAIL because fetcher is absent.

- [ ] **Step 4: Implement the smallest HTTP boundary.**

Create src/lib/http/api-error.ts:

~~~ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super("HTTP " + status);
    this.name = "ApiError";
  }
}
~~~

Implement fetcher with native fetch. It parses only application/json responses, returns undefined for empty successful bodies, and throws ApiError for non-OK responses.

- [ ] **Step 5: Verify the passing fetcher test.**

~~~powershell
npm run test -- src/lib/http/fetcher.test.ts
~~~

Expected: PASS.

- [ ] **Step 6: Write failing production environment tests.**

Create src/lib/env.test.ts:

~~~ts
import { expect, it } from "vitest";
import { validateEnvironment } from "./env";

it("allows empty development integration values", () => {
  expect(validateEnvironment({ NODE_ENV: "development" }).NODE_ENV).toBe("development");
});

it("requires integrations in production", () => {
  expect(() => validateEnvironment({ NODE_ENV: "production" })).toThrow();
});
~~~

- [ ] **Step 7: Confirm the missing-module failure, then implement the contract.**

~~~powershell
npm run test -- src/lib/env.test.ts
~~~

Expected: FAIL because env is absent.

Create src/lib/env.ts with Zod parsing NODE_ENV, NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_TOSS_CLIENT_KEY, and REVALIDATE_SECRET. Require the three integrations only in production. Create scripts/validate-env.ts calling the function with process.env and document empty values in .env.example.

- [ ] **Step 8: Verify and commit infrastructure.**

~~~powershell
npm run test -- src/lib/http/fetcher.test.ts src/lib/env.test.ts
npm run validate:env
git add package.json package-lock.json vitest.config.ts src/lib src/test scripts .env.example
git commit -m "feat: add HTTP and environment infrastructure"
~~~

Expected: both tests and local validation pass.

### Task 3: Configure query state, MSW, linting, and formatting

**Files:**
- Create: src/app/query-provider.tsx, src/app/query-provider.test.tsx, src/mocks/browser.ts, src/mocks/handlers.ts, src/mocks/server.ts, prettier.config.mjs, .prettierignore
- Modify: src/app/layout.tsx, eslint.config.mjs, package.json, package-lock.json

**Interfaces:**
- Produces: createQueryClient(): QueryClient and QueryProvider({ children }: PropsWithChildren).
- Produces: an empty MSW handlers array with browser and Node setup exports.

- [ ] **Step 1: Install and configure formatting.**

~~~powershell
npm install -D eslint-config-prettier prettier prettier-plugin-tailwindcss
~~~

Add format as prettier --write . and format:check as prettier --check .. Append eslint-config-prettier/flat after generated Next rules. Ignore .next, coverage, node_modules, playwright-report, and test-results.

- [ ] **Step 2: Write the failing Query client test.**

Create src/app/query-provider.test.tsx:

~~~tsx
import { expect, it } from "vitest";
import { createQueryClient } from "./query-provider";

it("uses one retry for REST requests", () => {
  expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(1);
});
~~~

- [ ] **Step 3: Confirm the failure and implement the provider.**

~~~powershell
npm run test -- src/app/query-provider.test.tsx
~~~

Expected: FAIL because query-provider is absent.

Create a client-side query-provider module. createQueryClient returns a QueryClient with retry 1. QueryProvider keeps one client with useState(createQueryClient) and renders QueryClientProvider. Render QueryProvider once around children in the root layout.

- [ ] **Step 4: Configure MSW without global production activation.**

~~~powershell
npm install msw
npx msw init public --save
~~~

Export handlers = [] from mocks/handlers.ts, setupWorker(...handlers) from browser.ts, and setupServer(...handlers) from server.ts. Do not import MSW runtime modules from layout.tsx.

- [ ] **Step 5: Verify and commit client infrastructure.**

~~~powershell
npm run test -- src/app/query-provider.test.tsx
npm run format:check
npm run lint
npm run typecheck
git add src/app src/mocks public/mockServiceWorker.js eslint.config.mjs prettier.config.mjs .prettierignore package.json package-lock.json
git commit -m "feat: configure query state and mocks"
~~~

Expected: all checks pass.

### Task 4: Add Storybook, Playwright, CI, and the baseline route

**Files:**
- Create: .storybook/main.ts, .storybook/preview.ts, playwright.config.ts, src/e2e/home.spec.ts, .github/workflows/ci.yml
- Modify: src/app/layout.tsx, src/app/page.tsx, package.json, package-lock.json, README.md, .gitignore

**Interfaces:**
- Produces: Storybook for src stories, a Chromium E2E command, and CI validation on pull requests and main pushes.

- [ ] **Step 1: Initialize Storybook and Playwright.**

~~~powershell
npx storybook@latest init --yes
npm init playwright@latest -- --yes --browser chromium --no-github-actions
~~~

- [ ] **Step 2: Configure Storybook and delete generated demo stories.**

Use the Next.js framework, the glob ../src/**/*.stories.@(ts|tsx), and the accessibility addon. Do not keep a generated sample design-system component.

- [ ] **Step 3: Write the failing home E2E test.**

Create src/e2e/home.spec.ts:

~~~ts
import { expect, test } from "@playwright/test";

test("renders the Jangingmall frontend foundation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/장인몰/);
  await expect(page.getByRole("main")).toContainText(
    "프론트엔드 기반 환경이 준비되었습니다.",
  );
});
~~~

- [ ] **Step 4: Confirm the failure and implement the minimum route.**

~~~powershell
npx playwright install chromium
npm run test:e2e
~~~

Expected: FAIL because the title and main copy do not yet match.

Set metadata title to 장인몰. Render one semantic main with 프론트엔드 기반 환경이 준비되었습니다. Add Storybook, Storybook-build, and test:e2e scripts; configure Playwright to run Chromium against npm run dev.

- [ ] **Step 5: Create CI and repository documentation.**

Write the workflow for pull requests and main pushes: npm ci, validate:env, format:check, lint, typecheck, test, build, Storybook build, Playwright Chromium installation, and E2E. Update README with npm setup, every validation command, directory ownership rules, exact core versions, and Vercel deployment target.

- [ ] **Step 6: Verify and commit delivery tooling.**

~~~powershell
npm run validate:env
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run build-storybook
npm run test:e2e
git add .storybook .github playwright.config.ts src/e2e src/app package.json package-lock.json README.md .gitignore
git commit -m "chore: add frontend delivery tooling"
~~~

Expected: all commands pass.

### Task 5: Publish and verify

**Files:**
- Modify: only files required to correct a demonstrated final-check failure.

**Interfaces:**
- Produces: the verified frontend foundation on origin/main.

- [ ] **Step 1: Run final validation.**

~~~powershell
npm run validate:env
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run build-storybook
npm run test:e2e
git status --short
~~~

Expected: all commands pass and the worktree is clean.

- [ ] **Step 2: Publish and verify main.**

~~~powershell
git push origin main
git log --oneline -4
git ls-remote --heads origin main
~~~

Expected: origin/main resolves to the local final commit.

