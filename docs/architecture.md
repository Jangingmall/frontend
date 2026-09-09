# 아키텍처와 코드 배치

> **원본**: 노션 「시스템 아키텍처」 (링크 추가 필요)
> **기준일**: 2026-09-08
> **상태**: 재구성 초안
> **관련 문서**: [conventions.md](conventions.md) · [data-layer.md](data-layer.md) · [ui-system.md](ui-system.md) · [testing.md](testing.md) · [routing-and-auth.md](routing-and-auth.md) · [isr.md](isr.md)

## 1. 목적과 범위

이 문서는 코드를 기술적 역할과 재사용 범위에 따라 배치하는 기준을 정의한다. 폴더 이름만 나누는 것이 아니라 각 영역의 책임과 의존성 방향을 함께 정한다.

**다루는 것**

- `src/` 아래 역할별 디렉터리와 책임
- Next.js `app/` route와 화면 전용 UI의 배치
- 컴포넌트의 재사용 범위별 배치
- import 규칙과 의존성 방향
- 도메인·상태가 늘어날 때의 확장 규칙

**다루지 않는 것**

- 데이터 요청·상태 관리 패턴 → [data-layer.md](data-layer.md)
- 네이밍·컴포넌트·주석 등 코드 컨벤션 → [conventions.md](conventions.md)
- 디자인 토큰·컴포넌트 분류·상태 컴포넌트 → [ui-system.md](ui-system.md)
- 테스트·Storybook 규칙 → [testing.md](testing.md)
- 라우팅·인증·SEO → [routing-and-auth.md](routing-and-auth.md)
- ISR 재검증 → [isr.md](isr.md)
- 기능·화면 설계 (레포에 두지 않고 노션에서 관리)

## 2. 기술 스택

핵심 선택만 기록한다. 각 항목의 사용 원칙은 소관 문서에서 정의한다.

| 영역                  | 선택                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| 프레임워크·라우팅     | Next.js App Router (번들러는 기본 Turbopack, Vite 미도입)                                         |
| 언어                  | TypeScript                                                                                        |
| CSS·토큰              | Tailwind CSS + Figma 기반 FE 토큰                                                                 |
| 기반 UI               | shadcn/ui (프로젝트 내부 수정 버전)                                                               |
| 아이콘                | 디자인팀 제공 SVG 자산                                                                            |
| 폰트                  | `next/font/local` (Pretendard)                                                                    |
| 이미지                | `next/image` 우선, 동적 업로드는 `browser-image-compression` + Presigned URL, 정적 변환은 `sharp` |
| 애니메이션            | CSS·Tailwind 전환 우선, 필요 시 Motion                                                            |
| HTTP                  | native `fetch` 기반 공통 fetcher                                                                  |
| 서버 상태             | TanStack Query                                                                                    |
| 전역 클라이언트 상태  | Zustand (실제 필요 시에만)                                                                        |
| 복잡한 불변 상태 갱신 | Immer (갱신 복잡도가 실제로 높을 때)                                                              |
| 폼                    | React Hook Form                                                                                   |
| 런타임 검증           | Zod                                                                                               |
| URL 상태              | Next.js 기본 기능 (`useSearchParams`, `searchParams`), nuqs 미도입                                |
| 날짜·시간             | Day.js                                                                                            |
| API 모킹              | MSW                                                                                               |
| 결제                  | 토스페이먼츠 SDK                                                                                  |
| 단위 테스트           | Vitest                                                                                            |
| 컴포넌트 확인         | Storybook (+ React Testing Library)                                                               |
| E2E                   | Playwright                                                                                        |
| 패키지 매니저         | npm (`package-lock.json`)                                                                         |
| 배포                  | Vercel                                                                                            |
| CI                    | GitHub Actions                                                                                    |
| 다국어                | 현 단계 미도입                                                                                    |

## 3. 구조 원칙

- 모든 애플리케이션 소스 코드는 `src/` 아래에 둔다.
- 코드는 `app`, `components`, `api`, `queries`처럼 기술적 역할을 기준으로 분리한다.
- 같은 역할 안에서는 상품·장인·주문 등 도메인 이름으로 하위 코드를 묶는다.
- 공용화 여부는 이름이나 외형이 아니라 재사용 범위와 책임을 기준으로 판단한다.
- 특정 화면·도메인에서만 쓰는 코드를 성급하게 전역 공용 영역으로 옮기지 않는다.
- 서버 상태, URL 상태, 폼 상태, 로컬 UI 상태, 전역 클라이언트 상태는 서로 다른 책임으로 관리한다.

## 4. 최상위 구조

```
src/
  app/
  api/
  components/
  queries/
  types/
  hooks/
  stores/          # 실제 전역 Zustand 상태가 생길 때만 생성
  lib/
  utils/
  constants/
  assets/
  mocks/
  e2e/

public/
.storybook/
```

| 위치              | 책임                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/`        | Next.js route, layout, route-level loading·error·not-found, metadata, 화면 조합 진입                          |
| `src/app/api/`    | ISR 재검증 webhook route handler(`POST /api/revalidate`) 전용. 일반 REST proxy·BFF는 두지 않는다              |
| `src/api/`        | REST API 호출, 백엔드 DTO, 응답 검증, DTO→FE 모델 변환, 도메인별 mock                                         |
| `src/components/` | Base·공용·도메인 공용 UI 컴포넌트                                                                             |
| `src/queries/`    | 서버 상태 Query·mutation hook, query key, Query 전용 타입                                                     |
| `src/types/`      | 여러 역할이 공유하는 FE 도메인 모델                                                                           |
| `src/hooks/`      | 도메인 비종속 공용 custom hook                                                                                |
| `src/stores/`     | 서버 상태와 구분되는 전역 클라이언트 상태. 필요 시에만 생성                                                   |
| `src/lib/`        | 외부 라이브러리 설정·어댑터·인프라 공통 코드 (HTTP fetcher, `ApiError`, Day.js 설정, `env.ts` 환경 변수 검증) |
| `src/utils/`      | 부수 효과 없는 순수 함수                                                                                      |
| `src/constants/`  | 앱 전체에서 공유하는 불변 값                                                                                  |
| `src/assets/`     | 소스 코드에서 import·가공하는 정적 자산                                                                       |
| `src/mocks/`      | MSW 실행 설정과 도메인 handler 등록                                                                           |
| `src/test/`       | 단위·컴포넌트 테스트 공통 setup                                                                               |
| `src/e2e/`        | 여러 route를 넘나드는 E2E 시나리오                                                                            |
| `public/`         | URL로 직접 제공할 정적 자산                                                                                   |
| `.storybook/`     | Storybook 실행 설정                                                                                           |

`src/assets/fonts/`에는 `next/font/local`로 불러올 Pretendard 폰트 파일을 둔다. 이미지 원본과 디자인팀 제공 SVG 아이콘은 `src/assets/images/`, `src/assets/icons/`에 둔다. 아이콘에 공통 props·접근성·상호작용 규칙이 필요하면 `components/ui/`에서 감싼 컴포넌트를 제공한다. URL로 직접 제공해야 하는 자산만 `public/`에 둔다.

Next.js 설정 파일, 환경 변수 파일, `package.json`은 프로젝트 루트에 둔다. 배포 환경의 환경 변수 검증 러너는 루트 `scripts/validate-env.ts`가 `src/lib/env.ts`를 호출하는 형태로 둔다.

## 5. `app/`과 화면 전용 UI

### 5.1 `app/`의 책임

`app/`은 실제 pathname을 관리하는 Next.js App Router 영역이다.

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` 등 route 파일 규칙을 관리한다.
- route parameter, metadata, route-level loading·error 경계를 처리한다.
- 해당 route의 화면 UI를 조합하는 진입점이 된다.
- `app/layout.tsx`는 전역 layout을 담당한다.
- 전역 Query Provider는 별도 `providers/` 디렉터리 없이 `src/app/query-provider.tsx` 파일 하나로 둔다.

### 5.2 화면 모듈 배치

별도 `screens/` 디렉터리는 만들지 않는다. 화면 단위 UI는 해당 route의 `page.tsx`와 private folder인 `_components/`에 배치한다.

```
src/app/
  products/
    [slug]-[productId]/
      page.tsx
      _components/
        ProductDetailGallery.tsx
        ProductPurchasePanel.tsx
```

`_components/`는 해당 route에서만 사용하는 화면 전용 UI를 위한 위치다. 다른 route에서도 재사용하게 된 UI는 재사용 범위에 맞춰 `components/`의 공용 또는 도메인 영역으로 옮긴다.

## 6. 컴포넌트 배치

컴포넌트는 재사용 범위에 따라 배치한다.

```
src/components/
  ui/
  common/
  product/
  artisan/
  order/
```

| 위치                   | 책임                                     | 예시                                     |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| `components/ui/`       | 디자인 시스템 기반의 UI 요소             | Button, TextField, SearchField, Skeleton |
| `components/common/`   | 도메인에 종속되지 않는 공용 UI·상태 표현 | Header, Footer, EmptyState, ErrorState   |
| `components/{domain}/` | 여러 화면에서 재사용되는 도메인 UI       | ProductCard, ProductPrice, ArtisanCard   |
| `app/.../_components/` | 해당 route에서만 사용하는 화면 전용 UI   | 상품 상세 갤러리, 결제 주문 요약 블록    |

`components/ui/`와 `components/common/`은 API, Query, Zustand store, 도메인 컴포넌트에 의존하지 않는다. 재사용 가능한 도메인 컴포넌트는 가능한 한 데이터를 props로 받고, 서버 상태 조회는 화면 조합 코드가 담당한다.

컴포넌트 분류(Base/Shared/Domain)의 승격 기준과 상태 컴포넌트 설계는 [ui-system.md](ui-system.md)에서 정의한다.

## 7. 공통 코드 배치

| 위치         | 책임                                         | 예시                                                  |
| ------------ | -------------------------------------------- | ----------------------------------------------------- |
| `lib/`       | 외부 라이브러리 설정·어댑터·인프라 공통 코드 | HTTP fetcher, `ApiError`, Day.js 설정, 환경 변수 검증 |
| `utils/`     | 부수 효과 없는 순수 함수                     | 금액·날짜 포맷, 문자열 변환, 범위 제한                |
| `constants/` | 앱 전체의 불변 값                            | 공통 제한값, 지원 파일 확장자                         |

상품·주문·컴포넌트 전용 helper와 상수는 전역 공용 영역이 아니라 해당 소유 코드 가까이에 둔다.

데이터 계층(`api/`, `queries/`, `lib/http/`)의 내부 배치와 책임은 [data-layer.md](data-layer.md), 테스트·Storybook·MSW handler 배치는 [testing.md](testing.md)에서 정의한다.

## 8. Import 규칙

### 8.1 경로 표기

- 같은 역할·도메인 내부 import는 상대 경로를 사용한다.
- 다른 역할 또는 도메인을 참조할 때는 `@/` 절대 경로를 사용한다.
- `../../../`처럼 상위 디렉터리를 여러 단계 거슬러 올라가는 import는 사용하지 않는다.

### 8.2 의존성 방향

| 영역                                     | 참조 가능 영역                                                  | 직접 참조하지 않는 영역                     |
| ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| `app/`                                   | 모든 소스 영역                                                  | 없음                                        |
| 화면 조합 코드                           | `components`, `queries`, `hooks`, `types`, `utils`, `constants` | `api` 직접 호출                             |
| `components/ui`, `components/common`     | `hooks`, `types`, `utils`, `constants`                          | `api`, `queries`, `stores`, 도메인 컴포넌트 |
| `components/{domain}`                    | `types`, `hooks`, `utils`, `constants`                          | `api` 직접 호출                             |
| `queries/`                               | `api`, `types`, `lib`, `utils`, `constants`                     | `app`, `components`                         |
| `api/`                                   | `lib`, `types`, `utils`, `constants`                            | `app`, `components`, `queries`, `stores`    |
| `stores/`                                | `types`, `lib`, `utils`, `constants`                            | `api`, `queries`, 화면·컴포넌트             |
| `lib/`, `utils/`, `constants/`, `types/` | 하위 공통 코드                                                  | 상위 역할 코드                              |

Client Component는 서버 전용 코드·비밀 환경 변수·서버 전용 API 구현을 import하지 않는다. Server Component는 필요한 Client Component를 경계로 렌더링할 수 있다.

### 8.3 공개 export

모든 디렉터리에 `index.ts` 배럴 파일을 강제하지 않는다. 외부에 노출할 여러 항목이 생긴 모듈에만 공개 export 용도로 사용한다.

## 9. 확장 규칙

- 새로운 도메인이 추가되면 필요한 역할 디렉터리 안에 같은 도메인 이름으로 코드를 추가한다. 예: `api/review/`, `queries/review/`, `components/review/`, `types/review.ts`.
- 실제 전역 상태가 처음 필요해질 때만 `stores/`를 생성해 Zustand를 사용한다. 구현 완료 시 사용처가 없으면 Zustand 의존성을 제거한다.
- 도메인·route 전용 코드가 여러 곳에서 재사용되기 시작하면, 재사용 범위에 맞는 `components/{domain}`, `hooks/`, `utils/` 등으로 이동한다.
- 화면 전용 UI는 route 내부 `_components/`에 유지하며, 이름이 비슷하다는 이유만으로 공용화하지 않는다.
- 현재 구조에 없는 `features`, `widgets`, `shared` 레이어는 팀이 아키텍처 변경을 합의하기 전까지 새로 도입하지 않는다.
- 정적·동적 이미지 처리, API 계약 생성, 인증 모델처럼 별도 설계가 필요한 항목은 이 구조 원칙을 따르되 세부 계약은 관련 문서에서 정의한다.

## 참고

- Next.js App Router 프로젝트 구조
- Next.js `page.tsx`와 `layout.tsx`
- Next.js `revalidateTag`
