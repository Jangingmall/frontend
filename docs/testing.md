# 테스트와 품질 검증

> **원본**: 노션 「시스템 아키텍처」 2.5·11장
> **기준일**: 2026-09-08
> **상태**: 재구성 초안 (구현 반영: `vitest.config.ts`, `playwright.config.ts`, `.storybook/`, `src/test/`, `src/mocks/`)
> **관련 문서**: [architecture.md](architecture.md) · [conventions.md](conventions.md) · [data-layer.md](data-layer.md) · [ui-system.md](ui-system.md)

## 1. 도구 구성

| 영역                 | 도구                                                            | 사용 원칙                                            |
| -------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| 린트                 | ESLint (`eslint.config.mjs`)                                    | 코드 규칙 검사. `npm run lint`                       |
| 포맷                 | Prettier (`prettier.config.mjs`, `prettier-plugin-tailwindcss`) | 형식 정리. `npm run format` / `format:check`         |
| 타입                 | `tsc --noEmit`                                                  | `npm run typecheck`                                  |
| 단위·컴포넌트 테스트 | Vitest (`environment: jsdom`) + React Testing Library           | `npm run test` (`vitest run`)                        |
| 컴포넌트 확인        | Storybook (`@storybook/nextjs-vite`) + `addon-a11y`             | 컴포넌트를 독립적으로 확인. `npm run storybook`      |
| E2E                  | Playwright (chromium, Desktop Chrome)                           | 주요 흐름의 브라우저 검증. `npm run test:e2e`        |
| API 모킹             | MSW                                                             | 백엔드 연결 전·테스트·개발 중 REST 모킹              |
| 접근성               | Storybook `addon-a11y` + Playwright + 수동                      | 자동 검사는 보조. 키보드·스크린리더·화면 문맥은 수동 |
| 자동 시각 회귀       | 도입하지 않음                                                   | 화면 디자인 검토는 수동                              |

커밋 시 `lint-staged`가 staged 파일에 `eslint --fix` + `prettier --write`를 실행한다. 커밋 메시지 형식은 `scripts/verify-commit-msg.ts` 훅이 검증한다(→ [git-convention.md](git-convention.md)).

## 2. 배치

단위·컴포넌트 테스트와 Storybook story는 **대상 코드 옆**에 둔다.

```
src/components/product/
  ProductCard.tsx
  ProductCard.test.tsx
  ProductCard.stories.tsx

src/api/product/
  api.ts
  api.test.ts
  validation.ts
  mapper.ts
  mock/
    handlers.ts        # 도메인 MSW handler
    fixtures.ts
```

| 위치                     | 내용                                                                          |
| ------------------------ | ----------------------------------------------------------------------------- |
| `{대상}.test.ts(x)`      | 대상 코드 옆. 단위·컴포넌트 테스트                                            |
| `{대상}.stories.tsx`     | 대상 코드 옆. Storybook story                                                 |
| `src/test/`              | 테스트 공통 setup (`setup.ts`)                                                |
| `src/e2e/`               | 여러 route를 넘나드는 E2E 시나리오 (`{시나리오}.spec.ts`)                     |
| `src/api/{domain}/mock/` | 도메인 MSW handler·fixture                                                    |
| `src/mocks/`             | 실행 환경별 MSW 설정(`browser.ts`, `server.ts`)과 handler 등록(`handlers.ts`) |
| `.storybook/`            | Storybook 실행 설정 (프로젝트 루트)                                           |

## 3. 파일 네이밍

| 대상                 | 규칙                                  | 예시                                      |
| -------------------- | ------------------------------------- | ----------------------------------------- |
| 단위·컴포넌트 테스트 | `{대상 파일명}.test.ts` / `.test.tsx` | `fetcher.test.ts`, `ProductCard.test.tsx` |
| E2E                  | `{시나리오}.spec.ts`                  | `home.spec.ts`                            |
| Storybook            | `{컴포넌트}.stories.tsx`              | `Button.stories.tsx`                      |

## 4. Vitest

- 설정(`vitest.config.ts`): `environment: jsdom`, `pool: forks`, `restoreMocks: true`, `setupFiles: ["./src/test/setup.ts"]`, `src/e2e/**` 제외, `@` alias.
- `src/test/setup.ts`: `@testing-library/jest-dom/vitest` 확장 + `afterEach(cleanup)`.
- **MSW를 쓰는 테스트**는 `src/test/setup.ts`에서 `server`(`src/mocks/server.ts`) 라이프사이클을 건다: `beforeAll(listen)` → `afterEach(resetHandlers)` → `afterAll(close)`. 도메인 handler는 `src/api/{domain}/mock/handlers.ts`에 두고 `src/mocks/handlers.ts`에 등록한다.
- 응답 스키마 검증은 실제 코드와 같은 Zod 스키마(`api/{domain}/validation.ts`)를 mock fixture에도 적용해 계약 일치를 보장한다(→ [data-layer.md](data-layer.md) §4.3).

## 5. 무엇을 테스트하는가

정량 커버리지 목표는 아직 없다(§8). 아래는 **반드시 테스트 대상**으로 삼는 것.

| 대상                                      | 이유                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `api/{domain}/validation.ts`, `mapper.ts` | DTO 검증·FE 모델 변환. 계약 드리프트를 여기서 잡는다                           |
| `lib/` 순수 로직                          | 이미 `env`, `http/fetcher`, `isr/revalidation` 테스트됨. 동일 기준 유지        |
| 도메인 로직이 있는 커스텀 훅              | 상태 전이·파생 값                                                              |
| 컴포넌트                                  | 상호작용·상태 분기(로딩/빈/에러/권한)를 RTL로. **시각 확인은 Storybook**       |
| 폼                                        | Zod 스키마 검증, 서버 에러 → 폼 레벨 매핑(→ [data-layer.md](data-layer.md) §8) |
| E2E                                       | 주요 **구매·인증·판매자** 흐름 (§6)                                            |

- Storybook과 RTL은 병행한다: 시각·변형은 story, DOM 상호작용 검증은 `.test.tsx`.
- `addon-a11y`로 story 단위 자동 접근성 검사를 보조로 돌린다.

## 6. E2E 범위

- 대상: 주요 구매·인증·판매자 흐름 (routing-and-auth.md Route Map 기준).
- 설정(`playwright.config.ts`): `testDir: src/e2e`, chromium(Desktop Chrome), `baseURL: http://localhost:3000`, `fullyParallel`.
- 로컬은 `npm run dev`, CI는 `npm run build && npm run start`로 서버를 띄운다. CI는 `retries: 2`, `trace: on-first-retry`, 실패 시 `playwright-report/` 아티팩트 업로드.

### 예비 시나리오 (결제 플로우 설계 후 확정)

- 상품 탐색: 홈 → 목록 → 필터 → 상세
- 검색: 검색어 입력 → 결과
- 장바구니: 상세 → 담기 → 장바구니 확인 → 수량 변경, 게스트 → 로그인 병합
- 인증: 회원가입, 로그인, 로그아웃, 보호 경로 접근 시 `/login` 리다이렉트
- 구매: 장바구니 → 결제(토스 모킹) → 주문 완료 → 주문 목록
- 판매자: 로그인 → `/seller` → AI 상세 제작 (AI 콘텐츠 계약 확정 후)

## 7. CI

`.github/workflows/ci.yml` — `pull_request` 및 `main`/`dev` push에서 실행.

| Job          | 명령                                                               |
| ------------ | ------------------------------------------------------------------ |
| Code Quality | `validate:env` → `format:check` → `lint` → `typecheck`             |
| Unit Test    | `test`                                                             |
| Build        | `build` + `build-storybook`                                        |
| E2E          | `playwright install chromium` → `test:e2e` (실패 시 리포트 업로드) |

## 8. 미확정 / 후속

| 항목                  | 내용                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 커버리지 정책         | 현재 CI 게이트 없음. §5 "반드시 테스트" 목록이 최소 기준. `vitest --coverage` 리포트는 가능하되 게이트는 안 검는다. 정량 % gate는 코드베이스 성숙 후(MVP 이후) 재검토 |
| MVP E2E 시나리오 목록 | §6 예비 목록 기준. 결제 플로우 설계와 함께 확정                                                                                                                       |

접근성 기준은 [ui-system.md](ui-system.md) §8, 자동 시각 회귀는 도입하지 않음(§1)으로 각각 정리됨.
