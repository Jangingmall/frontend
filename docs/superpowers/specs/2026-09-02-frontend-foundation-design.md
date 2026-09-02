# Frontend Foundation Design

**Source specification:** [기술 스택 정리 & 아키텍처 설계](https://app.notion.com/p/3cfecddcc9cb80f9becbcbb0ad75c201)

## Goal

Create a clean, deployable baseline for the Jangingmall frontend in this repository. The baseline must enforce the architecture in the source specification without inventing product, order, seller, payment, or authentication screens before their contracts are defined.

## Package and version policy

Use npm and commit `package-lock.json`. The versions explicitly supplied by the team are installed as exact versions:

| Package | Version |
| --- | --- |
| TypeScript | `7.0.2` |
| Next.js | `16.3.3` |
| Tailwind CSS | `4.3.3` |
| shadcn/ui | `4` |
| `@tanstack/react-query` | `5.102.6` |
| Zustand | `5.0.15` |

The initial baseline also includes React Hook Form with its Zod resolver, Zod, Day.js, `browser-image-compression`, Sharp, MSW, ESLint, Prettier, Vitest, Storybook, Playwright, and the testing-library packages. Motion, Immer, and the Toss Payments SDK remain uninstalled until a defined feature needs them.

If npm cannot resolve a required exact version or its peer dependencies, implementation stops and reports the conflict; versions are never silently substituted.

## Application architecture

The application uses Next.js App Router, TypeScript, Tailwind CSS, Turbopack, `src/`, and the `@/*` alias. Application source is organized by technical role, then by domain once contracts exist.

```text
src/
  app/                    # routes, layouts, metadata, route boundaries
    query-provider.tsx    # the single global TanStack Query provider
  api/                    # REST calls, DTO validation, mappers, domain mocks
  components/
    ui/                   # shadcn/ui-derived design-system elements
    common/               # domain-independent shared UI
  queries/                # TanStack Query hooks and query keys
  types/                  # cross-role frontend domain models
  hooks/                  # domain-independent custom hooks
  stores/                 # Zustand stores; created for actual shared client state
  lib/
    http/                 # fetcher and normalized ApiError
    env.ts                # Zod environment contract
  utils/                  # pure helpers
  constants/              # shared immutable values
  assets/
    fonts/                # provided Pretendard files for next/font/local
  mocks/                  # MSW runtime setup and handler aggregation
  e2e/                    # cross-route Playwright scenarios
public/                   # direct URL static assets
.storybook/               # Storybook configuration
```

The initial commit creates only reusable infrastructure and intentional boundary placeholders. No fake domain API, Zustand store, or product UI is introduced. Zustand is installed at the requested version, but its first store is created only when a shared client-state requirement exists.

## Data and runtime boundaries

Browser REST state flows through `screen or route composition → TanStack Query hook → api function → common fetcher`. The common fetcher normalizes unsuccessful HTTP responses into `ApiError` and parses JSON only when it is present. API response validation and DTO-to-frontend-model conversion stay inside `src/api/{domain}`.

Server Component ISR data uses server-side functions and Next.js cache tags, not TanStack Query hooks. URL state stays in the Next.js router/search-parameter APIs. Form state stays with React Hook Form and Zod schemas located near the form. Zustand is reserved for cross-route client UI state, not server data.

`src/app/query-provider.tsx` is the only global client Query provider. It creates one `QueryClient` per mounted application and does not persist server data. MSW provides browser and Node setup with an initially empty handler list and is never enabled globally in production.

## Configuration and quality gates

`src/lib/env.ts` defines a Zod-backed `validateEnvironment` function. Local development accepts omitted integration values; production requires `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`, and `REVALIDATE_SECRET`. The `validate:env` script is run by CI before the production build. Browser-visible configuration uses `NEXT_PUBLIC_`; server secrets never do.

Tests are colocated with their subject except for E2E tests under `src/e2e/`. The starter verification sequence is:

```text
npm run validate:env
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run build-storybook
npm run test:e2e
```

GitHub Actions runs the same validation on pull requests and pushes to `main`, including a Chromium Playwright smoke test. Vercel remains the deployment target; this task does not create or link a Vercel project, because that requires the team’s deployment-account decision.

## User-facing baseline

The only route is a minimal homepage with the metadata title `장인몰` and a short message that the frontend foundation is ready. It is deliberately not a product design or a placeholder marketplace implementation.

## Acceptance criteria

- The repository is `Jangingmall/frontend`; the former local `artisan-mall-web` project is not reused.
- Exact supplied package versions are present in `package.json` and `package-lock.json`.
- The directory and import-boundary conventions above are present.
- Environment validation, formatting, linting, type checking, unit tests, production build, Storybook build, and Chromium E2E pass locally.
- CI executes the documented checks from a clean npm install.
- The resulting baseline is committed and pushed to `main`.
