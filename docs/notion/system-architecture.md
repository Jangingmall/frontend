## 1. 목적과 범위

이 문서는 프로젝트의 코드를 기술적 역할과 재사용 범위에 따라 배치하는 기준을 정의한다. 폴더 이름만 나누는 것이 아니라, 각 영역의 책임과 의존성 방향을 함께 정한다.

다음 항목을 다룬다.

- `src/` 아래의 역할별 디렉터리와 책임
- Next.js `app/` route와 화면 전용 UI의 배치
- 컴포넌트, REST API, Query, 타입, schema, 상태, mock, 테스트의 배치
- 서버·클라이언트 데이터 요청 및 ISR 재검증의 경계
- import 규칙

다음 항목은 다루지 않는다.

- 기술 스택 전체 목록과 라이브러리 선정 근거
- 실제 모든 route·도메인·파일의 전체 목록
- 컴포넌트별 props·variant·시각 디자인
- 백엔드 REST API의 endpoint·요청·응답 상세 명세
- 화면별 사용자 흐름과 상세 기능 명세

## 2. 기술 구성

별도 기술 스택 표에는 핵심 기술만 기록한다. 이 절에서는 전체 기술 구성, 도입 상태, 사용 원칙을 기록한다.

### 2.1 기반·렌더링

| 항목                 | 선택               | 사용 원칙                                                                                                                                                       |
| -------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 웹 프레임워크·라우팅 | Next.js App Router | 라우팅, layout, Server/Client Component, metadata 등 Next.js 기본 기능을 사용한다. 앱 번들러는 Next.js 기본 Turbopack을 사용하며 Vite를 별도로 도입하지 않는다. |
| 언어·타입 시스템     | TypeScript         | TypeScript를 기본으로 사용한다. 불가피한 경우에만 JavaScript를 사용한다.                                                                                        |

### 2.2 UI·디자인·이미지

| 항목                    | 선택                           | 사용 원칙                                                                                                                                                           |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS·토큰 사용           | Tailwind CSS                   | Figma 기반 FE 토큰을 Tailwind 사용 방식으로 연결한다. semantic token이 있으면 우선 사용한다.                                                                        |
| 기반 UI 컴포넌트        | shadcn/ui                      | 필요한 컴포넌트만 추가하고, PD 디자인 시스템에 맞춘 프로젝트 내부 버전을 사용한다.                                                                                  |
| 아이콘                  | 디자인팀 제공 SVG 자산         | 제공 자산을 우선 사용한다. 디자인에 없는 아이콘이 실제로 필요해지면 별도 도입 여부를 검토한다.                                                                      |
| 폰트                    | `next/font`                    | Pretendard 사용 시 `next/font/local`을 사용한다.                                                                                                                    |
| 이미지 렌더링           | `next/image` 우선              | 동적 사용자 업로드 이미지는 S3/CDN의 WebP URL과 이미지 크기 정보를 전달해 표시한다. 적용이 불가능하거나 부적합한 경우에만 일반 `<img>` 또는 `<picture>`를 사용한다. |
| 동적 이미지 변환·업로드 | `browser-image-compression`    | 브라우저에서 320w·640w·1280w WebP 변형을 생성한 뒤 Presigned URL로 S3에 직접 업로드한다.                                                                            |
| 정적 이미지 최적화      | `sharp`                        | 정적 자산의 변환 시점·생성 규격은 정적 이미지 배포 흐름에 맞춰 구현 단계에서 구체화한다.                                                                            |
| 애니메이션              | CSS·Tailwind 기본 전환, Motion | 기본적으로 CSS와 Tailwind를 사용한다. PD 디자인 또는 상호작용 요구가 기본 기능으로 구현하기 어려운 경우에만 Motion을 적용한다.                                      |

### 2.3 데이터·상태·입력

| 항목                  | 선택                             | 사용 원칙                                                                                                            |
| --------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| HTTP 통신 기반        | native `fetch` 기반 공통 fetcher | `fetch`를 직접 흩어 쓰지 않고, 공통 fetcher에서 기본 요청 처리·HTTP 오류 정규화를 제공한다.                          |
| 서버 상태·비동기 요청 | TanStack Query                   | REST 조회·mutation의 캐시, 로딩, 오류, 무효화를 관리한다. 서버 데이터를 전역 클라이언트 상태에 중복 저장하지 않는다. |
| 클라이언트 전역 상태  | Zustand                          | 서버 상태와 구분되는 전역 UI·클라이언트 상태가 실제로 필요할 때 사용한다. 구현 완료 시 사용처가 없으면 제거한다.     |
| 복잡한 불변 상태 갱신 | Immer                            | 중첩된 객체 상태의 갱신 복잡도가 실제로 높을 때 추가한다.                                                            |
| 폼 상태               | React Hook Form                  | 입력 등록, 제출, 필드 오류 표시 등 폼 상호작용을 관리한다.                                                           |
| 런타임 검증           | Zod                              | 폼 입력, API 응답, 환경 변수의 런타임 검증에 사용한다.                                                               |
| URL 상태              | Next.js 기본 기능                | `useSearchParams`, `useRouter`, 페이지의 `searchParams`를 사용한다. nuqs는 도입하지 않는다.                          |
| 날짜·시간             | Day.js                           | 날짜·시간 처리에 사용한다.                                                                                           |
| API 모킹              | MSW                              | 백엔드 연결 전·테스트·개발 중 REST 요청을 모킹한다.                                                                  |

### 2.4 외부 연동·계약

| 항목           | 선택                             | 사용 원칙                                                                                                                      |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 결제           | 토스페이먼츠 SDK                 | 클라이언트는 SDK로 결제창 요청 및 결과 redirect를 처리한다. 최종 결제 승인처럼 비밀 키가 필요한 처리는 별도 백엔드가 담당한다. |
| 다국어         | 현 단계 미도입                   | 지원 언어, URL 정책, 번역 운영 방식이 결정되기 전까지 도입하지 않는다.                                                         |
| 환경 변수 검증 | Zod + 명시적 `validate:env` 실행 | CI·배포 빌드 전에 별도 검증 스크립트를 실행하며, 공개 변수와 서버 전용 비밀 값을 분리한다.                                     |

### 2.5 품질 검증

| 영역                  | 선택                                          | 사용 원칙                                                                                                   |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 린트·포맷             | ESLint + Prettier                             | ESLint는 코드 규칙 검사, Prettier는 코드 형식 정리를 담당한다.                                              |
| 단위 테스트           | Vitest                                        | 단위 테스트 실행 환경으로 사용한다.                                                                         |
| 컴포넌트 확인·테스트  | Storybook 중심                                | 컴포넌트를 독립적으로 확인하고, 필요한 DOM 상호작용 검증은 React Testing Library + Vitest와 병행할 수 있다. |
| E2E 테스트            | Playwright                                    | 주요 구매·인증·판매자 흐름의 브라우저 단위 검증에 사용한다.                                                 |
| 접근성 검사           | Storybook + Playwright 자동 검사 및 수동 검사 | 자동 검사는 보조 수단으로 사용하고, 키보드·스크린 리더·화면 문맥은 수동으로도 확인한다.                     |
| 자동 시각 회귀 테스트 | 도입하지 않음                                 | 화면 디자인 검토는 수동으로 진행한다.                                                                       |

### 2.6 배포·운영

| 항목            | 선택           | 사용 원칙                                                     |
| --------------- | -------------- | ------------------------------------------------------------- |
| 패키지 관리자   | npm            | lockfile은 `package-lock.json`을 사용한다.                    |
| 프론트엔드 배포 | Vercel         | Next.js 애플리케이션의 빌드·배포 환경으로 사용한다.           |
| CI              | GitHub Actions | 빌드, 타입 검사, 린트, 테스트 등 확정된 검증 절차를 실행한다. |

## 3. 구조 원칙

- 모든 애플리케이션 소스 코드는 `src/` 아래에 둔다.
- 코드는 `app`, `components`, `api`, `queries`처럼 기술적 역할을 기준으로 분리한다.
- 같은 역할 안에서는 상품·장인·주문 등 도메인 이름으로 하위 코드를 묶는다.
- 공용화 여부는 이름이나 외형이 아니라 재사용 범위와 책임을 기준으로 판단한다.
- 특정 화면에서만 쓰는 코드와 특정 도메인에서만 쓰는 코드를 성급하게 전역 공용 영역으로 옮기지 않는다.
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

| 위치              | 책임                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------ |
| `src/app/`        | Next.js route, layout, route-level loading·error·not-found, metadata, 화면 조합 진입 |
| `src/api/`        | REST API 호출, DTO, 응답 검증, DTO→FE 모델 변환, 도메인별 mock                       |
| `src/components/` | Base·공용·도메인 공용 UI 컴포넌트                                                    |
| `src/queries/`    | 서버 상태 Query·mutation hook, query key, Query 전용 타입                            |
| `src/types/`      | 여러 역할이 공유하는 FE 도메인 모델                                                  |
| `src/hooks/`      | 도메인 비종속 공용 custom hook                                                       |
| `src/stores/`     | 서버 상태와 구분되는 전역 클라이언트 상태. 필요 시에만 생성                          |
| `src/lib/`        | 외부 라이브러리 설정·어댑터·인프라 공통 코드                                         |
| `src/utils/`      | 순수 함수                                                                            |
| `src/constants/`  | 앱 전체에서 공유하는 불변 값                                                         |
| `src/assets/`     | 소스 코드에서 import·가공하는 정적 자산                                              |
| `src/mocks/`      | MSW 실행 설정과 도메인 handler 등록                                                  |
| `src/e2e/`        | 여러 route를 넘나드는 E2E 시나리오                                                   |
| `public/`         | URL로 직접 제공할 정적 자산                                                          |
| `.storybook/`     | Storybook 실행 설정                                                                  |

`src/assets/fonts/`에는 `next/font/local`로 불러올 Pretendard 폰트 파일을 둔다. 이미지 원본과 디자인팀 제공 SVG 아이콘은 `src/assets/images/`, `src/assets/icons/`처럼 소스 코드에서 import·변환할 자산 영역에 둔다. 아이콘에 공통 props·접근성·상호작용 규칙이 필요하면 `components/ui/`에서 해당 자산을 감싼 컴포넌트를 제공한다. URL로 직접 제공해야 하는 자산만 `public/`에 둔다.

Next.js 설정 파일, 환경 변수 파일, `package.json`은 프로젝트 루트에 둔다.

## 5. `app/`과 화면 전용 UI

### 5.1 `app/`의 책임

`app/`은 실제 pathname을 관리하는 Next.js App Router 영역이다.

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` 등 Next.js route 파일 규칙을 관리한다.
- route parameter, metadata, route-level loading·error 경계를 처리한다.
- 해당 route의 화면 UI를 조합하는 진입점이 된다.
- `app/layout.tsx`는 전역 layout을 담당한다.
- 전역 Query Provider는 별도 `providers/` 디렉터리를 만들지 않고 `src/app/query-provider.tsx` 파일 하나로 둔다.

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

## 7. REST API와 Query 배치

### 7.1 기본 호출 흐름

클라이언트에서 서버 상태를 사용하는 기본 흐름은 다음과 같다.

```
화면 조합 코드
  → TanStack Query hook
    → API 함수
      → 공통 fetcher
        → 외부 REST API
```

컴포넌트와 화면 조합 코드는 API endpoint 또는 HTTP 오류 형식을 직접 다루지 않는다. API 함수는 공통 fetcher를 사용하고, Query hook은 조회·mutation·캐시 무효화를 담당한다.

### 7.2 도메인별 배치

```
src/api/
  product/
    validation.ts
    mapper.ts
    mock/
      handlers.ts
      fixtures.ts

src/queries/
  product/
```

| 영역                | 책임                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| `api/{domain}/`     | endpoint 호출, 백엔드 DTO, `validation.ts`의 응답 검증, mapper를 통한 FE 모델 변환 |
| `queries/{domain}/` | Query·mutation hook, query key, 목록 조회·페이지네이션 등 Query 전용 상태·타입     |
| `lib/http/`         | 공통 fetcher, HTTP 오류 정규화, 도메인 비종속 요청 기반                            |

프론트엔드 내부의 도메인 모델은 camelCase를 사용한다. 백엔드의 응답 표기와 내부 모델의 차이는 `api/{domain}/`의 검증·변환 계층에서 처리한다.

API 타입·클라이언트는 현재 수동으로 작성해 연동한다. OpenAPI 명세 제공 여부는 백엔드와 별도 협의하되, 이는 기술 스택 선정 항목이 아니라 API 계약·개발 방식에 관한 정책이다.

### 7.3 서버 요청과 ISR 재검증

Server Component에서 ISR 대상 공개 데이터를 조회할 때는 Query hook을 사용하지 않는다.

```
Server Component / page
  → 서버용 데이터 조회 함수(캐시 태그 부여)
    → API 함수 또는 공통 fetcher
      → 외부 REST API
```

- 공통 fetcher는 HTTP 요청·오류 변환만 담당하며 ISR 태그를 직접 알지 않는다.
- 서버용 데이터 조회 코드만 Next.js 캐시 정책과 tag를 부여한다.
- `POST /api/revalidate`는 일반 REST API proxy나 BFF가 아니다. 백엔드 변경 이벤트에 대응해 tag를 `revalidateTag`로 무효화하는 webhook endpoint다.
- 재검증 endpoint와 서버 데이터 조회 코드는 tag 명명 계약만 공유하며, 서로의 endpoint 호출 로직에 직접 의존하지 않는다.
- TanStack Query의 브라우저 캐시와 Next.js ISR 캐시는 별개다. mutation 직후 현재 사용자 화면의 서버 상태 갱신은 Query 무효화로 처리한다.

## 8. 타입과 validation 배치

### 8.1 타입

공유 FE 도메인 모델은 초기에는 도메인별 단일 파일로 둔다.

```
src/types/
  product.ts
  artisan.ts
  order.ts
```

- `types/{domain}.ts`에는 여러 역할이 공유하는 FE 도메인 모델을 둔다.
- 공용 모델이 충분히 커져 독립된 하위 모델 단위가 생길 때만 `types/{domain}/`으로 확장한다.
- 백엔드 DTO는 `api/{domain}/`에 둔다.
- Query 전용 입력·페이지네이션 타입은 `queries/{domain}/`에 둔다.
- 컴포넌트 props와 route 전용 상태 타입은 해당 코드 가까이에 둔다.

### 8.2 Zod validation

전역 `schemas/` 디렉터리는 만들지 않는다.

- REST API 응답 검증 schema와 함수는 `api/{domain}/validation.ts`에 둔다.
- 폼 입력 schema는 해당 폼·route·컴포넌트 가까이에 둔다.
- 환경 변수 schema와 실행 검증은 `lib/env.ts`에 둔다.
- 여러 곳에서 동일한 검증 조각이 실제로 반복될 때만 공용화 위치를 추가로 검토한다.

## 9. Hook과 클라이언트 상태 배치

### 9.1 Hook

```
src/hooks/
  use-debounce.ts
  use-media-query.ts
```

- `queries/`에는 TanStack Query 기반 서버 상태 hook만 둔다.
- `hooks/`에는 도메인 비종속 공용 custom hook만 둔다.
- 도메인·컴포넌트·route 전용 hook은 해당 소유 코드 가까이에 둔다.
- 전역 Zustand store를 위한 selector·보조 hook은 해당 store 가까이에 둔다.

### 9.2 Zustand store

`stores/`는 실제 전역 클라이언트 상태가 생길 때만 생성한다.

| 상태 종류                                         | 관리 위치                    |
| ------------------------------------------------- | ---------------------------- |
| REST API 데이터                                   | TanStack Query               |
| 검색·필터·정렬처럼 URL에 남아야 하는 상태         | search parameter             |
| 폼 입력·검증·제출 상태                            | 폼 코드와 React Hook Form    |
| 한 컴포넌트·route에서만 쓰는 UI 상태              | 소유 코드 내부의 local state |
| 여러 route·컴포넌트가 공유하는 클라이언트 UI 상태 | Zustand `stores/` 후보       |

하나의 거대한 전역 store는 만들지 않는다. store는 실제 책임 단위로 나누며, 새로고침 이후에도 남겨야 하는 상태만 별도 persistence 정책을 정한 뒤 저장한다.

## 10. 공통 코드와 mock 배치

### 10.1 공통 코드

| 위치         | 책임                                         | 예시                                                |
| ------------ | -------------------------------------------- | --------------------------------------------------- |
| `lib/`       | 외부 라이브러리 설정·어댑터·인프라 공통 코드 | HTTP fetcher, ApiError, Day.js 설정, 환경 변수 검증 |
| `utils/`     | 부수 효과 없는 순수 함수                     | 금액·날짜 포맷, 문자열 변환, 범위 제한              |
| `constants/` | 앱 전체의 불변 값                            | 공통 제한값, 지원 파일 확장자                       |

상품·주문·컴포넌트 전용 helper와 상수는 위 전역 공용 영역이 아니라 해당 소유 코드 가까이에 둔다.

### 10.2 MSW mock

도메인별 MSW handler와 fixture는 해당 API 코드 옆에 둔다. 실행 환경별 설정과 handler 등록만 `mocks/`에서 담당한다.

```
src/api/product/mock/
  handlers.ts
  fixtures.ts

src/mocks/
  browser.ts
  server.ts
  handlers.ts
```

## 11. 테스트와 Storybook 배치

단위·컴포넌트 테스트와 Storybook story는 대상 코드 옆에 둔다.

```
src/components/product/
  ProductCard.tsx
  ProductCard.test.tsx
  ProductCard.stories.tsx

src/api/product/
  api.ts
  api.test.ts
```

여러 route를 넘나드는 E2E 시나리오는 `src/e2e/`에서 관리한다. Storybook 실행 설정은 프로젝트 루트의 `.storybook/`에 둔다.

## 12. Import 규칙

### 12.1 경로 표기

- 같은 역할·도메인 내부 import는 상대 경로를 사용한다.
- 다른 역할 또는 도메인을 참조할 때는 `@/` 절대 경로를 사용한다.
- `../../../`처럼 상위 디렉터리를 여러 단계 거슬러 올라가는 import는 사용하지 않는다.

### 12.2 의존성 방향

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

### 12.3 공개 export

모든 디렉터리에 `index.ts` 배럴 파일을 강제하지 않는다. 외부에 노출할 여러 항목이 생긴 모듈에만 공개 export 용도로 사용한다.

## 13. 확장 규칙

- 새로운 도메인이 추가되면 필요한 역할 디렉터리 안에 같은 도메인 이름으로 코드를 추가한다. 예: `api/review/`, `queries/review/`, `components/review/`, `types/review.ts`.
- 실제 전역 상태가 처음 필요해질 때만 `stores/`를 생성해 Zustand를 사용한다. 구현 완료 시 사용처가 없으면 Zustand 의존성을 제거한다.
- 도메인·route 전용 코드가 여러 곳에서 재사용되기 시작하면, 재사용 범위에 맞는 `components/{domain}`, `hooks/`, `utils/` 등으로 이동한다.
- 화면 전용 UI는 route 내부 `_components/`에 유지하며, 단순히 이름이 비슷하다는 이유만으로 공용화하지 않는다.
- 정적·동적 이미지 처리, API 계약 생성, 인증 모델처럼 별도 설계가 필요한 항목은 이 구조 원칙을 따르되 세부 계약은 관련 문서에서 정의한다.

## 14. 참고

- Next.js App Router 프로젝트 구조
- Next.js `page.tsx`와 `layout.tsx`
- Next.js `revalidateTag`
