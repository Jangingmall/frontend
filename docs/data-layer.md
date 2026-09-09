# 데이터 계층

> **원본**: 노션 「시스템 아키텍처」 7·8·9장 + BE 레포 `docs/API_공통규칙.md`, `docs/예외_설계.md`, `docs/PHASE2-1_API_협업_계약서.md`
> **기준일**: 2026-09-08
> **상태**: 재구성 초안 (설계 진행 중 — 현재 구현은 임시)
> **관련 문서**: [architecture.md](architecture.md) · [api-contract.md](api-contract.md) · [routing-and-auth.md](routing-and-auth.md) · [isr.md](isr.md) · [ui-system.md](ui-system.md)

## 1. 목적과 범위

REST API 호출, 응답 검증·변환, 서버 상태 관리, 에러 처리, 폼 처리의 계층 구조와 규칙을 정의한다.

- 엔드포인트·DTO·상태 enum 등 개별 API 계약 → [api-contract.md](api-contract.md)
- 인증 토큰 라이프사이클·인가 처리 → [routing-and-auth.md](routing-and-auth.md)
- ISR 서버 데이터 조회·재검증 → [isr.md](isr.md)

> **errorCode의 기준은 BE `global/exception/ErrorCode.java` enum이다.** Notion·이 문서는 파생이라 지연될 수 있으므로, FE는 알 수 없는 코드도 안전하게 처리한다(§5).

## 2. 호출 흐름

### 2.1 클라이언트 (브라우저)

```
화면 조합 코드
  → TanStack Query hook          (queries/{domain}/)
    → 도메인 API 함수             (api/{domain}/api.ts)
      → 클라이언트 fetcher        (lib/http/client.ts)
        → 응답 검증·변환          (api/{domain}/validation.ts, mapper.ts)
          → 화면용 도메인 모델    (types/{domain}.ts)
```

- 인증이 필요한 조회·뮤테이션은 모두 이 경로를 쓴다.
- 컴포넌트·화면 조합 코드는 endpoint, HTTP method, 응답 래퍼, 인증 헤더를 직접 다루지 않는다.

### 2.2 서버 (RSC · Route Handler)

```
Server Component / page
  → 서버 데이터 조회 함수 (캐시 태그 부여)
    → 서버 fetcher (lib/http/fetcher.ts)
      → 외부 REST API
```

- **Public·ISR 대상 공개 데이터 조회 전용.** access token이 브라우저 메모리에만 있으므로(→ [routing-and-auth.md](routing-and-auth.md)) RSC에서는 인증된 사용자 데이터를 조회하지 않는다.
- 서버 조회 코드만 Next.js 캐시 정책과 tag를 부여한다. 자세한 규칙은 [isr.md](isr.md).

## 3. 디렉터리·파일 구성

```
src/api/{domain}/
  api.ts          # endpoint 호출 함수 (도메인 API 함수)
  validation.ts   # Zod 응답 스키마 + z.infer로 파생한 DTO 타입
  mapper.ts       # DTO → FE 도메인 모델 변환 (camelCase 정리 포함)
  mock/
    handlers.ts   # MSW 도메인 handler
    fixtures.ts   # mock 데이터
  api.test.ts

src/queries/{domain}/
  keys.ts         # query key 팩토리
  queries.ts      # useQuery hook (목록은 page 파라미터 기반)
  mutations.ts    # useMutation hook
  types.ts        # 목록 파라미터·페이지네이션 등 Query 전용 타입

src/lib/http/
  fetcher.ts      # 서버 fetcher (apiFetch, fetchPublicApi, fetchPrivateApi)
  client.ts       # 클라이언트 fetcher (인증 헤더 주입 + 401 자동 refresh)
  api-error.ts    # ApiError
```

- 전역 `schemas/`·`dto/` 디렉터리는 만들지 않는다. 응답 스키마와 DTO 타입은 `api/{domain}/validation.ts`에 함께 둔다.
- BE DTO 타입은 별도 파일로 손으로 쓰지 않고 `z.infer<typeof schema>`로 파생해 스키마와 항상 일치시킨다.
- 여러 도메인이 공유하는 FE 모델은 `types/{domain}.ts`.

## 4. fetcher 계층

### 4.1 서버 fetcher — `lib/http/fetcher.ts` (현행 유지)

- `apiFetch<T>(path, options)` — `process.env.API_BASE_URL` 기준, `{ success, status, data }` 래퍼를 해제하고 실패 시 `ApiError`를 던진다.
- `fetchPublicApi<T>(path, { tags, revalidate })` — ISR 태그 조회.
- `fetchPrivateApi<T>(path, options)` — `cache: "no-store"` 조회. (현재 인증 헤더 주입은 없음. 서버에서 인증 호출을 하지 않기로 했으므로 용도는 no-store 공개 조회로 한정한다.)

### 4.2 클라이언트 fetcher — `lib/http/client.ts` (신규)

- **Base URL은 상대경로 `/api`.** FE·BE가 same-origin이고(Vercel rewrite로 `/api/*`를 백엔드로 전달 — [routing-and-auth.md](routing-and-auth.md) §7) 브라우저 요청이므로 절대 URL이 필요 없다. `NEXT_PUBLIC_API_BASE_URL`은 두지 않는다.
- 인증이 필요한 요청에 메모리의 access token을 `Authorization: Bearer {accessToken}`로 주입한다. Public 요청에는 넣지 않는다.
- 쿠키가 필요한 요청은 refresh(`POST /api/member/token/refresh`)뿐이며 `credentials: "same-origin"`으로 호출한다. 그 외 요청은 `credentials` 기본값. 쿠키·CORS 정책은 [routing-and-auth.md](routing-and-auth.md) §4.
- 응답 처리(래퍼 해제, `ApiError` throw)는 서버 fetcher와 동일 규칙을 공유한다. 공통 로직은 한 곳에 두고 두 fetcher가 재사용한다.
- **401 처리**: `UNAUTHORIZED` 응답을 받으면
  1. 진행 중인 refresh가 없으면 `POST /api/member/token/refresh` 호출 (single-flight — 동시 다발 401은 하나의 refresh Promise를 공유)
  2. refresh 성공 → 새 access token으로 원요청 1회 재시도
  3. refresh 실패 → `ApiError`를 그대로 전파하고, 전역 처리(§6)가 로그인 리다이렉트 + 토큰·캐시 클리어를 수행
- 재시도는 401 refresh 경로에서 1회로 한정한다. 그 외 재시도는 TanStack Query가 담당(§6).

### 4.3 응답 검증·변환

- **모든 도메인 응답을 `api/{domain}/validation.ts`의 Zod 스키마로 검증**한 뒤 `mapper.ts`로 FE 도메인 모델(camelCase)로 변환한다.
- 모든 응답 스키마는 `.passthrough()`를 기본으로 한다. BE가 필드를 추가해도 FE가 깨지지 않는다. 목록 item 스키마만 명시한다.
- 검증 실패 처리는 환경별로 분기한다:
  - **dev·preview**: `parse` 실패 시 throw → 에러 화면에서 즉시 발견 (BE 연동 초기 계약 드리프트를 빠르게 잡는다)
  - **prod**: `safeParse` 실패 시 throw하지 않고 `reportSchemaMismatch`(§5.2)로 기록 후 원본 데이터로 진행
  - 단 **결제·주문·인증** 도메인은 prod에서도 `parse` throw
- MSW mock fixture도 같은 스키마로 검증해 mock ↔ 실제 계약 일치를 보장한다(→ [testing.md](testing.md) §4).

## 5. `ApiError`와 에러 코드

`lib/http/api-error.ts` (현행 구조 유지·확장):

```ts
class ApiError extends Error {
  status: number; // HTTP status
  code: string | undefined; // 응답 body의 errorCode (없을 수 있음)
  body: unknown; // 원본 실패 응답
}
```

- `code`는 문자열 그대로 보관한다. 알려진 코드 유니온(`ErrorCode.java` 미러)은 **타입 힌트·문구 매핑 참고용**이며, 유니온에 없는 코드가 와도 fetcher·화면이 깨지지 않아야 한다.
- 알려진 코드: `INVALID_INPUT`, `REQUEST_INVALID`, `REQUEST_BODY_MALFORMED`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `TOKEN_MISMATCH`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `CONCURRENT_UPDATE`, `RESOURCE_EXPIRED`, `BUSINESS_RULE_VIOLATION`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`. (`MISMATCH`는 BE 추가 예정 — 미리 포함해 둔다.)
- `errorCode`가 없는 실패(예: 일부 410, 인프라 오류)는 `status`만으로 처리한다.

### 5.1 사용자 문구 매핑

- 사용자에게 보여줄 한글 문구는 **FE가 소유**한다. `constants/error-messages.ts`에 `errorCode → 문구`, 그리고 `status → 문구` fallback을 둔다.
- BE 응답의 `message`는 로깅·개발용 fallback으로만 쓴다. 단 `BUSINESS_RULE_VIOLATION`, `CONFLICT`처럼 BE가 맥락 있는 문구를 주는 경우, 호출부 판단으로 `message`를 그대로 노출할 수 있다.
- 매핑 우선순위: `errorCode` 전용 문구 → `status` 문구 → 공통 기본 문구.
- 골격은 `ErrorCode.java` 14개 코드 + `status` fallback + `GENERIC`으로 지금 작성한다. 문구 카피 최종화는 서비스 톤·디자인 확정 후.

### 5.2 관측

- prod에서 응답 Zod `safeParse` 실패, 전역 `onError`의 5xx, Error Boundary 캐치는 `lib/observability.ts`의 `reportSchemaMismatch(context)` 등 단일 함수로 감싼다.
- 현재 구현은 내부가 `console.warn`. 에러 리포팅 도구 선정 시 이 함수 구현만 교체한다.

## 6. TanStack Query 규칙

### 6.1 QueryClient 기본 옵션

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status < 500
          ? false
          : failureCount < 2,
      staleTime: 0, // 도메인별로 개별 지정
    },
    mutations: { throwOnError: false },
  },
  queryCache: new QueryCache({ onError: handleGlobalQueryError }),
  mutationCache: new MutationCache({ onError: handleGlobalMutationError }),
});
```

- SSR 하이드레이션 대비 `QueryProvider`는 `useState(createQueryClient)`로 요청마다 새 client를 만든다(현행 유지).

### 6.2 조회 에러 표면화

| 대상                       | 설정                                                             | 표시                                            |
| -------------------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| 일반 조회 (영역/위젯 단위) | 기본값 `throwOnError: false`                                     | 컴포넌트가 `isError` 분기 → `ErrorState` 인라인 |
| 페이지 핵심 데이터         | `throwOnError: true` opt-in                                      | 가장 가까운 `error.tsx`                         |
| 없는 리소스                | `throwOnError: (e) => e instanceof ApiError && e.status === 404` | `not-found`                                     |

상태별 컴포넌트 책임(Skeleton / EmptyState / ErrorState / `error.tsx`)은 [ui-system.md](ui-system.md) 참조.

### 6.3 전역 `onError` (부수효과 전용)

화면 렌더와 무관하게 실행되는 공통 처리만 담당한다.

- `401` (`UNAUTHORIZED` / `TOKEN_EXPIRED` / `TOKEN_MISMATCH`) — refresh 흐름(§4.2) 실패가 확정된 경우 로그인 리다이렉트 + access token·Query 캐시 클리어
- `403` (`FORBIDDEN`) — 권한 안내. 리다이렉트 없음
- `429` / `5xx` / `RESOURCE_EXPIRED` — 공통 토스트, 필요 시 에러 리포팅
- 그 외 4xx — 전역 처리 없음(호출부·화면이 담당)

### 6.4 뮤테이션

- throw하지 않는다. 호출부 `onError`에서 처리한다.
- `INVALID_INPUT` — 폼 상단 레벨 에러로 표시(§8). 필드 매핑은 하지 않는다.
- `CONFLICT` / `BUSINESS_RULE_VIOLATION` — `errorCode`별로 폼 레벨 메시지 또는 특정 필드로 매핑(케이스별). BE `message` 노출 가능.
- 성공·실패 후 무효화는 §6.6.

### 6.5 query key 팩토리

```ts
// queries/product/keys.ts
export const productKeys = {
  all: ["product"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};
```

- key는 도메인별 `keys.ts`의 팩토리로만 생성한다. 문자열 배열을 hook 안에 직접 쓰지 않는다.
- 무효화는 팩토리의 상위 key(`productKeys.lists()`)로 범위를 지정한다.

### 6.6 무효화 규칙

- 뮤테이션 성공 시 영향받는 목록·상세 key를 `invalidateQueries`로 무효화하는 것을 기본으로 한다.
- 낙관적 업데이트는 찜 토글처럼 실패 확률이 낮고 즉시성이 중요한 상호작용에만 적용한다. 적용 시 `onMutate` 스냅샷 → `onError` 롤백 → `onSettled` 무효화를 세트로 구현한다.
- Public·ISR 캐시(Next.js)와 TanStack Query 브라우저 캐시는 별개다. 현재 사용자 화면의 서버 상태 갱신은 Query 무효화로, 백엔드 콘텐츠 변경의 공개 페이지 반영은 ISR 재검증으로 처리한다(→ [isr.md](isr.md)).

### 6.7 목록 페이지네이션

번호 페이지네이션을 사용한다(무한 스크롤 아님). BE에 `page`/`offset` 파라미터 추가를 요청했고(파라미터 이름·응답 형태는 BE 확정 대기 — §10), FE는 한 페이지씩 교체하는 방식으로 조회한다.

```ts
useQuery({
  queryKey: productKeys.list({ ...params, page }),
  queryFn: () => fetchProducts({ ...params, page }),
  placeholderData: keepPreviousData, // 페이지 이동 중 이전 데이터 유지
});
```

- `page`는 URL search parameter(`?page=3`)로 관리한다. 딥링크·공유·뒤로가기에서 보존된다.
- 총 페이지 수는 응답의 `totalCount`(+ `limit`) 또는 `totalPages`로 계산한다.
- 페이지네이션 컨트롤(이전/다음/번호)은 컴포넌트 레벨. 목록 변동 시 항목 중복·누락 가능성은 offset 방식의 알려진 한계로 감수한다.
- `useInfiniteQuery`(누적)는 현재 사용처가 없다. BE가 cursor를 병행 지원하고 특정 화면에 무한 스크롤이 필요해지면 그때 도입한다.

## 7. 상태 경계

| 상태 종류                                         | 관리 위치                                                      |
| ------------------------------------------------- | -------------------------------------------------------------- |
| REST API 데이터                                   | TanStack Query (`queries/{domain}/`)                           |
| 검색·필터·정렬처럼 URL에 남아야 하는 상태         | search parameter (Next.js)                                     |
| 폼 입력·검증·제출 상태                            | React Hook Form + Zod                                          |
| 한 컴포넌트·route에서만 쓰는 UI 상태              | 소유 코드 내부 local state                                     |
| 여러 route·컴포넌트가 공유하는 클라이언트 UI 상태 | Zustand `stores/` (실제 필요 시 생성)                          |
| 인증 상태 (메모리 access token·사용자)            | 인증 전용 store (→ [routing-and-auth.md](routing-and-auth.md)) |
| 게스트 장바구니 key                               | localStorage, 로그인 시 `POST /api/payments/cart/merge`        |

- 서버 데이터를 Zustand 등 전역 클라이언트 상태에 중복 저장하지 않는다.
- 하나의 거대한 전역 store를 만들지 않는다. store는 책임 단위로 나눈다.

## 8. 폼 처리

- 폼 스키마(Zod)는 해당 폼·route·컴포넌트 가까이에 둔다. 전역 `schemas/`는 만들지 않는다.
- **필드 단위 검증의 기준은 클라이언트 Zod다.** BE `ApiErrorResponse`에는 필드별 오류 구조가 없으므로(단일 `message` 문자열) 서버 `INVALID_INPUT`은 폼 상단 레벨 에러로만 표시한다.
- 서버가 준 `message`가 있으면 레벨 에러 문구로 노출 가능. 없으면 `constants/error-messages.ts`의 `INVALID_INPUT` 문구.
- 중복·비즈니스 규칙(`CONFLICT`, `BUSINESS_RULE_VIOLATION`)은 `errorCode` 기준으로 관련 필드 또는 폼 레벨에 매핑한다.
- 클라이언트 Zod 규칙은 BE 검증 규칙과 어긋나지 않도록 계약 변경 시 함께 갱신한다.
- **서버 `fieldErrors` 구조는 도입하지 않는다.** BE에 계약 변경을 요청하지 않으며, 필드 검증은 클라이언트 Zod로 충분하다고 본다.

## 9. 환경 변수

- `lib/env.ts`의 Zod 스키마가 단일 정의다. 배포 시 루트 `scripts/validate-env.ts`가 이를 실행해 검증한다.
- 서버 전용 값(`API_BASE_URL`, `REVALIDATE_WEBHOOK_SECRET`)과 공개 값(`NEXT_PUBLIC_*`)을 분리해 반환한다.
- 클라이언트 fetcher는 상대경로 `/api`를 쓰므로 브라우저용 API base URL 환경 변수는 필요 없다. 서버 fetcher(RSC/ISR)만 절대 URL `API_BASE_URL`을 쓴다.
- 코드에서 `process.env`를 직접 흩어 읽지 않고 `lib/env.ts`가 반환하는 객체를 사용한다.

## 10. 미확정 / 후속

| 항목                       | 내용                                                                     | 해소 조건                                              |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| same-origin rewrite 대상   | Vercel rewrite(`/api/*` → 백엔드)의 실제 백엔드 origin                   | 인프라 도메인 확정 후 `vercel.json`/`next.config` 설정 |
| 페이지네이션 파라미터·응답 | `page`+`size` vs `offset`+`limit`, 응답에 `totalPages` 포함 여부         | BE 반영 (FE 요청 발신 완료)                            |
| 응답 검증 관측             | `reportSchemaMismatch` 실제 전송 대상                                    | 에러 리포팅 도구 선정 후 (MVP 이후 관측 트랙)          |
| AI 생성 폴링 간격·타임아웃 | `generations/{id}` 폴링 주기·최대 대기 (WebSocket 아님 — BE 스택에 없음) | AI 상세 화면 설계 + AI 콘텐츠 DTO 계약 확정 후         |

`MISMATCH` errorCode(BE `ErrorCode.java` 반영 대기)는 `code: string` unknown-safe 설계로 이미 흡수되어 blocking이 아니다.
