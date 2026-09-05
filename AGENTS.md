<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 프로젝트 구조와 컨벤션

작업 전에 아래 문서를 읽는다:

- 디렉터리 구조, 역할별 배치, 의존성 방향: `docs/notion/system-architecture.md`
- Git 브랜치·커밋·코드 컨벤션: `docs/notion/git-convention.md`

그 외 API 연동·ISR 재검증·라우팅 계약은 `docs/notion/` 아래 문서를 참고한다.

## 명령어

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` / `npm run typecheck` / `npm run test` / `npm run test:e2e`
- `npm run format` / `npm run format:check`
- 패키지 매니저는 npm만 사용한다(`package-lock.json`이 유일한 락파일).

## 완료 기준

변경을 마쳤다고 판단하기 전에 최소한 `npm run typecheck`, `npm run lint`, `npm run test`를
통과시킨다. 라우팅·설정·빌드에 영향이 있으면 `npm run build`도 실행한다.
