## 1. 문서 정보

| 항목      | 내용                                                           |
| --------- | -------------------------------------------------------------- |
| 문서명    | Git & Code Convention                                          |
| 버전      | v1.0                                                           |
| 상태      | 팀 공통 적용안                                                 |
| 작성 목적 | 프로젝트 Git 및 코드 컨벤션 정의                               |
| 적용 범위 | Git 규칙은 전체 팀 공통, 코드 규칙은 Next.js와 TypeScript 중심 |

## 2. 브랜치 전략

### 브랜치 구조

| 브랜치         | 역할                                 |
| -------------- | ------------------------------------ |
| `main`         | 배포 가능한 안정 버전                |
| `dev`          | 기능을 통합하는 메인 개발 브랜치     |
| `feat/기능명`  | 기능 추가                            |
| `fix/버그명`   | 버그 수정                            |
| `chore/작업명` | 설정, 패키지, 환경 구성 등 기타 작업 |

### 네이밍 규칙

- 영어 소문자를 사용합니다.
- 여러 단어는 하이픈으로 구분합니다.
- 브랜치 이름만으로 작업 목적을 이해할 수 있게 작성합니다.
- 예: `feat/user-login`, `fix/scroll-bug`, `chore/eslint-setup`

### 분기 및 병합 방향

```
dev → feat/fix/chore → dev → main
```

- `feat`, `fix`, `chore` 브랜치는 항상 `dev`에서 분기합니다.
- 작업 브랜치는 리뷰를 거쳐 `dev`로 병합합니다.
- `dev`에서 `main`으로의 병합은 배포 시점에 진행합니다.
- 작업 브랜치는 `dev` 병합 후 삭제합니다.
- 하나의 브랜치에서는 하나의 기능 또는 작업만 처리합니다.

## 3. 커밋 컨벤션

### 기본 형식

```
type: subject
```

```
feat: 사용자 로그인 기능 추가
fix: 모바일 화면 스크롤 오류 수정
chore: ESLint 설정 추가
```

### Type 종류

| Type       | 설명                                                |
| ---------- | --------------------------------------------------- |
| `feat`     | 기능 추가                                           |
| `fix`      | 버그 수정                                           |
| `style`    | 포맷팅, 세미콜론 등 기능 변경이 없는 스타일 수정    |
| `refactor` | 기능 변경이 없는 코드 구조 개선                     |
| `chore`    | 설정, 패키지 설치 등 다른 Type에 해당하지 않는 작업 |
| `docs`     | 문서 작성 또는 수정                                 |
| `test`     | 테스트 작성 또는 수정                               |

### Subject 규칙

- 한국어와 영어를 모두 사용할 수 있습니다.
- 현재형과 단답형으로 작성합니다.
- 50자 이내로 간결하게 작성합니다.
- 마침표를 붙이지 않습니다.
- 커밋 메시지는 헤더만 작성합니다.

### 커밋 단위

- 하나의 커밋에는 하나의 목적만 담습니다.
- 서로 되돌릴 가능성이 있는 변경은 분리합니다.
- 기능 구현, 리팩터링, 문서 수정처럼 목적이 다른 변경을 한 커밋에 섞지 않습니다.

## 4. 코드 컨벤션

### 4.1 네이밍 규칙

| 대상                | 규칙                                                                                                            | 예시                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 변수 및 함수        | camelCase, 함수는 동사로 시작                                                                                   | `getUser`, `handleClick`     |
| Boolean 변수        | `is`, `has`, `can` 등으로 시작                                                                                  | `isLoading`, `hasError`      |
| 이벤트 핸들러       | `handle` prefix                                                                                                 | `handleSubmit`               |
| 이벤트 핸들러 Props | `on` prefix                                                                                                     | `onSubmit`                   |
| 컴포넌트            | PascalCase, 파일명과 컴포넌트명 일치. 단, `components/ui`의 shadcn/ui 생성 파일은 소문자 또는 kebab-case를 허용 | `UserCard.tsx`, `button.tsx` |
| 상수                | UPPER_SNAKE_CASE                                                                                                | `MAX_RETRY_COUNT`            |
| 타입 및 인터페이스  | PascalCase                                                                                                      | `UserProfile`                |
| 제네릭 타입         | 단일 대문자                                                                                                     | `T`, `K`, `V`                |
| 커스텀 훅           | `use` prefix                                                                                                    | `useAuth`, `useSocket`       |

- 의미를 파악하기 어려운 약어는 사용하지 않습니다. 예: `btn` 대신 `button`, `usr` 대신 `user`
- TypeScript `enum` 사용은 지양하고 `as const` 객체와 유니온 타입을 우선합니다.

### 4.2 디렉터리 구조와 책임

현재 `main` 브랜치와 README의 디렉터리 원칙을 기준으로 다음 구조를 사용합니다.

| 경로                    | 역할                                                                           |
| ----------------------- | ------------------------------------------------------------------------------ |
| `src/app`               | Next.js App Router의 route, layout, metadata, loading/error 경계와 화면 진입점 |
| `src/components/ui`     | shadcn/ui 기반 범용 UI 컴포넌트                                                |
| `src/components/common` | 특정 도메인에 종속되지 않는 팀 공용 UI 컴포넌트                                |
| `src/api`               | 도메인별 REST API 호출과 DTO 검증·변환                                         |
| `src/queries`           | TanStack Query hook과 query key                                                |
| `src/lib`               | HTTP, 환경 변수, ISR, 외부 라이브러리 설정 등 기반 모듈                        |
| `src/mocks`             | MSW browser/node 설정과 handler 등록                                           |
| `src/hooks`             | 여러 화면에서 재사용하는 공용 custom hook                                      |
| `src/constants`         | 여러 영역에서 공유하는 상수                                                    |
| `src/types`             | 여러 영역에서 공유하는 TypeScript 타입                                         |
| `src/utils`             | 특정 도메인에 종속되지 않는 utility 함수                                       |
| `src/test`              | unit 및 component test의 공통 setup                                            |
| `src/e2e`               | Playwright E2E test                                                            |

- `app`에는 라우트 진입점, layout, provider 등 App Router 경계의 코드를 둡니다.
- API 호출과 서버 상태는 각각 `api`, `queries`로 분리하고, 재사용 UI와 공용 로직은 책임에 따라 `components`, `hooks`, `lib`, `utils`에 둡니다.
- 현재 구조에 없는 `features`, `widgets`, `shared` 레이어는 팀이 아키텍처 변경을 합의하기 전까지 새로 도입하지 않습니다.

### 4.3 파일 및 폴더 규칙

| 대상                   | 규칙                                           | 예시                                                                              |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| 폴더                   | 소문자를 기본으로 하고 여러 단어는 kebab-case  | `user-profile/`, `api/revalidate/`                                                |
| Next.js 컨벤션 파일    | Next.js가 정한 기본 파일명 사용                | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`                  |
| 팀 작성 컴포넌트       | PascalCase, 파일명과 컴포넌트명 일치           | `UserCard.tsx`                                                                    |
| shadcn/ui 생성 파일    | `src/components/ui`에서 소문자 또는 kebab-case | `button.tsx`                                                                      |
| 보조 모듈              | 소문자를 기본으로 하고 여러 단어는 kebab-case  | `query-provider.tsx`, `api-error.ts`                                              |
| Unit 및 component test | 대상 파일명 뒤에 `.test.ts` 또는 `.test.tsx`   | `env.test.ts`, `fetcher.test.ts`                                                  |
| E2E test               | 시나리오 이름 뒤에 `.spec.ts`                  | `home.spec.ts`                                                                    |
| 설정 파일              | 각 도구의 공식 파일명 사용                     | `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts` |

- 설정 파일은 도구 또는 프레임워크가 요구하는 경우 default export를 허용하며, 이는 4.1의 named export 원칙에 대한 예외입니다.

### 4.4 Type과 Interface 사용 기준

**Type을 사용하는 경우**

- 유니온, 인터섹션, 튜플 등 복합 타입
- `Partial<T>`, `Pick<T, K>` 등 유틸리티 타입 조합
- 함수 타입

**Interface를 사용하는 경우**

- 컴포넌트 Props
- 클래스의 `implements`
- 외부 라이브러리 타입 확장과 선언 병합

### 4.5 컴포넌트 규칙

- 함수형 컴포넌트만 사용합니다.
- 컴포넌트당 하나의 파일을 사용합니다.
- Props 타입은 `interface`로 정의합니다.
- Props는 구조 분해 할당으로 사용합니다.
- 기본적으로 named export를 사용합니다.
- `page.tsx`, `layout.tsx` 등 Next.js 컨벤션 파일만 default export를 허용합니다.
- 로직이 복잡하거나 재사용이 필요하면 커스텀 훅으로 분리합니다.

### 4.6 Server Component와 Client Component

- 기본적으로 Server Component를 사용합니다.
- 클라이언트 상태, 이벤트 핸들러, 브라우저 API가 필요한 경우에만 파일 상단에 `'use client'`를 선언합니다.
- Client Component의 범위는 필요한 UI 경계까지 최소화합니다.
- 서버에서 처리할 수 있는 데이터 요청과 변환 로직을 불필요하게 클라이언트로 이동하지 않습니다.

### 4.7 주석 규칙

- 코드만으로 의도를 이해하기 어려운 경우에만 작성합니다.
- 주석은 한국어로 작성합니다.
- 후속 작업은 `TODO`, 알려진 문제는 `FIXME` 태그를 사용합니다.
- 코드가 무엇을 하는지보다 왜 그렇게 구현했는지 설명합니다.

## 5. GitHub Rule과의 구분

다음 항목은 별도의 **GitHub Rule** 문서에서 정의합니다.

- PR 제목과 본문 템플릿
- 리뷰어 수와 Approve 기준
- Change Request 처리 방식
- 병합 방식과 작성자 self-approve 제한
- `main`, `dev` 브랜치 보호 규칙
- 필수 CI 검사와 Issue 운영 방식
