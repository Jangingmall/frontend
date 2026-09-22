# Jangingmall Frontend

Jangingmall 팀의 Next.js App Router 프론트엔드입니다. Vercel 배포를 기준으로 합니다.

## 시작

```bash
npm install
npm run dev
```

## MSW 배포와 실제 API 개발

브랜치 이름으로 모드를 강제하지 않습니다. 팀원은 기존처럼 `dev`에서 작업 브랜치를
만들고 `.env.example`을 `.env.local`로 복사해 선택합니다. `.env.local`은 커밋하지 않습니다.

실제 API를 테스트하려면 로컬 `.env.local`을 다음처럼 설정하고 개발 서버를 재시작합니다.

```dotenv
NEXT_PUBLIC_API_MOCKING=
NEXT_PUBLIC_ALLOW_PRODUCTION_MOCK=
API_BASE_URL=http://localhost:8080
```

`API_BASE_URL`은 자신의 백엔드 또는 공용 테스트 서버 주소로 바꿉니다.
로컬 MSW가 필요하면 `NEXT_PUBLIC_API_MOCKING=enabled`만 설정합니다.

공유 사이트를 MSW 테스트용으로 배포할 때는 **Vercel 해당 프로젝트의 Production 환경**에만
아래 두 값을 설정합니다. 저장소나 `next.config.ts`에 값을 강제하지 않습니다.

```dotenv
NEXT_PUBLIC_API_MOCKING=enabled
NEXT_PUBLIC_ALLOW_PRODUCTION_MOCK=enabled
```

두 값이 모두 켜져야 Vercel Production에서 서버·브라우저 MSW 및 시연 주문 완료 화면을
사용할 수 있습니다. 테스트 신원·주문·결제는 모의 데이터입니다. 허용 플래그만 켜서는
MSW가 실행되지 않습니다. 실제 API 배포에서는 두 값을 비웁니다.

`NEXT_PUBLIC_*`는 빌드 시 반영되므로 환경변수 변경 후 **이 변경이 포함된 커밋을 새로 빌드·배포**해야 합니다.
기존 커밋의 재배포만으로 새 허용 플래그를 사용할 수 없습니다. `API_BASE_URL`과
`REVALIDATE_WEBHOOK_SECRET` 등 기존 필수 설정도 유지합니다.

팀원 안내: 공유 배포 사이트만 MSW로 운영하며, 로컬 실제 API 테스트 방식은 그대로입니다.
현재 배포의 소스 브랜치와 Vercel의 자동 Production 배포 브랜치는 다를 수 있으므로,
배포 담당자는 원하는 `dev` 커밋과 적용 도메인을 확인해야 합니다.

## 현재 구성

- Next.js 16.3.4, TypeScript 6.0.3, Tailwind CSS 4.3.3
- shadcn/ui v4, TanStack Query 5.102.8, Zustand 5.0.15
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

```bash
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
```

CI는 pull request와 main push에서 환경 변수 검증, 포맷, 린트, 타입 검사, 단위 테스트, 프로덕션 빌드, Storybook 빌드, Chromium E2E를 실행합니다.
Jangingmall frontend application
