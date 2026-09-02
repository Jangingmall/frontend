# Jangingmall Frontend

Jangingmall 팀의 Next.js App Router 프론트엔드입니다. Vercel 배포를 기준으로 합니다.

## 시작

~~~bash
npm install
npm run dev
~~~

## 현재 구성

- Next.js 16.3.3, TypeScript 7.0.2, Tailwind CSS 4.3.3
- shadcn/ui v4, TanStack Query 5.102.6, Zustand 5.0.15
- React Hook Form, Zod, Day.js, browser-image-compression, Sharp
- 공통 HTTP fetcher와 Zod 기반 환경 변수 검증
- MSW 브라우저·Node 설정 경계
- Vitest, Storybook, Playwright 및 GitHub Actions CI 환경

## 디렉터리 원칙

- src/app: App Router route, layout, metadata, 화면 진입점
- src/components/ui: shadcn/ui 기반 UI
- src/components/common: 도메인 비종속 공용 UI
- src/api: 도메인 REST 호출, DTO 검증·변환
- src/queries: TanStack Query hook과 query key
- src/lib: HTTP, 환경 변수, 외부 라이브러리 설정
- src/mocks: MSW 설정과 handler 등록

도메인 화면, API, Zustand store는 실제 계약이 생길 때 추가합니다. 서버 상태는 TanStack Query, URL 상태는 Next.js search parameter, 폼은 React Hook Form, 여러 route에서 공유하는 클라이언트 UI 상태는 Zustand를 사용합니다.

## 명령어

~~~bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run format
npm run format:check
npm run validate:env
npm run test
npm run storybook
npm run build-storybook
npm run test:e2e
~~~

CI는 pull request와 main push에서 환경 변수 검증, 포맷, 린트, 타입 검사, 단위 테스트, 프로덕션 빌드, Storybook 빌드, Chromium E2E를 실행합니다.
Jangingmall frontend application
