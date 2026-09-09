<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 프로젝트 구조와 컨벤션

작업 전에 관련 설계 문서를 읽는다. `docs/` 바로 아래:

- `architecture.md` — `src/` 디렉터리 구조·역할별 책임, 의존성 방향, import 규칙, 기술 스택
- `conventions.md` — 네이밍·파일 규칙, type/interface, 컴포넌트, Server/Client Component, 주석
- `data-layer.md` — 공통 fetcher, TanStack Query, DTO 검증·변환, 상태 경계, 폼, 에러 처리
- `api-contract.md` — 공통 응답 봉투·타입 규칙·errorCode, 도메인별 엔드포인트 (BE 명세 파생)
- `routing-and-auth.md` — URL 설계·Route Map, 인증 라이프사이클, 보호 라우트 가드, proxy, SEO
- `isr.md` — ISR 캐시 원칙, 태그 계약, 재검증 웹훅
- `ui-system.md` — 디자인 토큰, 컴포넌트 분류, 상태 표현 컴포넌트
- `testing.md` — Vitest/Playwright/Storybook/MSW 배치·규칙, CI
- `git-convention.md` — 브랜치·커밋·GitHub 운영 (프로세스)

## 명령어

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` / `npm run typecheck` / `npm run test` / `npm run test:e2e`
- `npm run format` / `npm run format:check`
- 패키지 매니저는 npm만 사용한다(`package-lock.json`이 유일한 락파일).

## 완료 기준

변경을 마쳤다고 판단하기 전에 최소한 `npm run typecheck`, `npm run lint`, `npm run test`를
통과시킨다. 라우팅·설정·빌드에 영향이 있으면 `npm run build`도 실행한다.
