# API 계약 (FE 파생)

> **원본**: BE 레포([Jangingmall/backend](https://github.com/Jangingmall/backend)) `docs/PHASE2-1_API_협업_계약서.md`, `docs/API_공통규칙.md`, `docs/예외_설계.md`, `docs/장인몰_API_계약서_공개조회.md`, `docs/PHASE2-2_인증_정책_계약서.md`, `docs/PHASE2-3_AI_통합_계약서.md`, `global/exception/ErrorCode.java` / 노션 [FE API 연동 계약](https://app.notion.com/p/API-3c29e3e335cc80d08a26e8b864d43f7f)
> **기준일**: 2026-09-08
> **상태**: 재구성 초안 (BE member/payment 모듈 미구현 — 엔드포인트 맵 수준)
> **관련 문서**: [data-layer.md](data-layer.md) · [routing-and-auth.md](routing-and-auth.md) · [isr.md](isr.md)

## 1. 사용 원칙

- 이 문서는 원본 명세를 대체하지 않는 FE용 파생 문서다. **엔드포인트 맵과 횡단 규칙**을 담고, 개별 요청/응답 필드 DTO는 BE REST Docs / `api-spec/openapi.json` / BE↔FE 계약서를 기준으로 한다.
- 컴포넌트는 백엔드 DTO에 직접 의존하지 않는다. `api/{domain}/` 계층이 응답을 검증(Zod)하고 camelCase FE 도메인 모델로 변환한다. 자세한 계층 규칙은 [data-layer.md](data-layer.md).
- 숫자·날짜·nullable의 의미가 불명확하면 추측해 보정하지 않고 §9 확인 항목으로 남긴다.
- request/response 필드의 추가·삭제·타입 변경은 BE가 사전 공지한다(팀 채널 + 명세 갱신).

## 2. 공통 규칙

| 항목         | 내용                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Base URL     | FE·BE same-origin (Vercel rewrite `/api/*` → 백엔드). 브라우저는 상대경로 `/api`, 서버 fetcher(RSC/ISR)만 절대 URL `API_BASE_URL` |
| 경로         | 버전 prefix 없이 `/api/{domain}/...`                                                                                              |
| Method       | `GET`, `POST`, `PATCH`, `DELETE`                                                                                                  |
| Content-Type | `application/json`                                                                                                                |
| 날짜·시간    | ISO 8601 UTC (`2026-09-01T00:00:00Z`)                                                                                             |
| 인증 헤더    | 인증 필요 API는 `Authorization: Bearer {accessToken}`. Public API에는 넣지 않는다                                                 |
| refresh 예외 | `POST /api/member/token/refresh`는 HttpOnly Cookie의 Refresh Token 사용 (헤더 아님)                                               |

### 2.1 공통 응답 봉투

```ts
type ApiResponse<T> = {
  success: true;
  status: number; // 실제 HTTP status와 동일
  data: T; // 본문 없는 응답은 null
};

type ApiErrorResponse = {
  success: false;
  status: number;
  errorCode: string; // §2.3
  message?: string; // 개발/로깅용. 일부 응답에만 존재
};

// 목록 응답. 페이지네이션 파라미터·응답 형태는 BE 확정 대기 (§2.4)
type PagedResponse<T> = {
  items: T[]; // 빈 배열 가능
  totalCount: number; // >= 0
  // + page/size/totalPages 또는 이에 준하는 필드 (BE 확정 후)
};
```

### 2.2 타입 규칙

- **모든 ID 필드는 `Long`** (FE에서는 `number`). Path·Query에서는 문자열로 실리지만 논리 타입은 숫자다. 숫자 아닌 값 → `400 INVALID_INPUT`.
  - 예외(문자열 식별자): `imageId`(ULID, 예 `image_01HXYZ`), `sessionId`(챗봇 세션), `orderNumber`(사람이 보는 주문번호 — `orderId`와 별개)
- **모든 금액 필드는 `Long`** (`price`, `priceDelta`, `amount`, `totalAmount` 등). 원화라 소수 단위 없음.
- **`rating`은 소수** (`4.8`), 후기 0건이면 `null` (0 아님).
- 이미지: `imageId`(ULID) + `variants` 배열. variant는 **320w / 640w / 1280w 고정 3종, `format: webp`**.

### 2.3 errorCode

**기준은 BE `global/exception/ErrorCode.java` enum이다.** Notion·BE 문서 간에도 목록이 어긋나 있으므로(§9), FE는 알 수 없는 코드도 `status` + 공통 문구로 안전하게 처리한다(→ [data-layer.md](data-layer.md) §5).

현재 `ErrorCode.java` 기준:

| errorCode                 | HTTP | 의미               |
| ------------------------- | ---- | ------------------ |
| `INVALID_INPUT`           | 400  | 입력값 유효성 오류 |
| `REQUEST_INVALID`         | 400  | Request Body 누락  |
| `REQUEST_BODY_MALFORMED`  | 400  | JSON 형식 오류     |
| `UNAUTHORIZED`            | 401  | 인증 필요          |
| `TOKEN_EXPIRED`           | 401  | 토큰 만료          |
| `TOKEN_MISMATCH`          | 401  | 토큰 무효          |
| `FORBIDDEN`               | 403  | 접근 권한 없음     |
| `NOT_FOUND`               | 404  | 리소스 없음        |
| `CONFLICT`                | 409  | 리소스 충돌(중복)  |
| `CONCURRENT_UPDATE`       | 409  | 낙관적 락 충돌     |
| `RESOURCE_EXPIRED`        | 410  | 리소스 만료        |
| `BUSINESS_RULE_VIOLATION` | 422  | 비즈니스 규칙 위반 |
| `TOO_MANY_REQUESTS`       | 429  | 요청 한도 초과     |
| `INTERNAL_ERROR`          | 500  | 서버 내부 오류     |

- `MISMATCH`(400, 결제 승인 등)는 BE 문서에 있으나 `ErrorCode.java` 미반영 — 추가 대기(§9).
- `errorCode` 없는 실패(일부 410, 인프라 오류)는 `status`만으로 처리.

### 2.4 페이지네이션

- FE는 **번호 페이지네이션**을 쓴다. BE에 `page`/`offset` 파라미터 추가를 요청했다 (기존 명세는 `cursor` 기반).
- **BE 확정 대기**: 최종 파라미터(`page`+`size` vs `offset`+`limit`, 둘 다 허용 여부)와 응답 형태(`totalPages` 포함 여부, `nextCursor` 제거 여부). `limit`/`size` 기본 20, 최대 100.
- 목록 변동 사이 페이지 이동 시 항목 중복·누락 가능성은 offset 방식의 알려진 한계로 감수한다.
- FE 사용 패턴은 [data-layer.md](data-layer.md) §6.7.

## 3. 역할과 인가

| Role           | 대상     | 주요 권한                                                |
| -------------- | -------- | -------------------------------------------------------- |
| Guest (비인증) | 미로그인 | 상품·장인 조회, 챗봇, 게스트 장바구니(localStorage — §8) |
| `USER`         | 소비자   | 장바구니, 주문·결제, 찜, 후기, 배송지                    |
| `ARTISAN`      | 판매자   | `USER` + 상품·콘텐츠·장인 프로필 관리                    |
| `ADMIN`        | 운영자   | 장인 가입 승인·반려                                      |

- FE는 `user.roles: Role[]` 배열로 판단한다(판매자는 `["USER","ARTISAN"]`). 라우트 가드는 [routing-and-auth.md](routing-and-auth.md) §5.
- API별 인증 수준(`Public` / `Public(게스트)` / `Authenticated` / `USER` / `ARTISAN` / `ADMIN`)은 BE `PHASE2-2` §5 표 기준.

## 4. 호출 계층

```
컴포넌트 → TanStack Query hook → 도메인 API 함수 → 공통 fetcher → DTO 검증·변환 → 화면용 도메인 모델
```

컴포넌트는 URL·method·응답 래퍼·인증 헤더를 직접 다루지 않는다. Query hook은 cache key·무효화, API 함수는 endpoint·변환을 담당한다.

## 5. 상품 도메인

### 공개 조회 (Public)

| Method | 경로                            | 용도                               |
| ------ | ------------------------------- | ---------------------------------- |
| GET    | `/api/products`                 | 목록·검색·필터·정렬 (페이지네이션) |
| GET    | `/api/products/{productId}`     | 상세                               |
| GET    | `/api/products/categories/main` | 메인 카테고리 목록                 |
| GET    | `/api/products/categories`      | 카테고리 필터 값 (동적)            |
| GET    | `/api/products/materials`       | 소재 필터 값 (동적)                |

- 목록 필터: `artisanId`, `category`, `subcategory`, `material`, `giftTheme`, `color`, `minPrice`, `maxPrice`, `hasGiftWrap`, `excludeSoldOut`(기본 `true`), `sort`, `keyword`.
- `isLimited`, `isCustomOrder`는 **필터가 아니라 응답 배지 속성**. `primaryBadge`는 서버가 한정수량 → 신작 → 인기 우선순위로 하나만 계산.
- 상품 상태: `DRAFT`, `ON_SALE`, `SOLD_OUT`, `HIDDEN`. **공개 목록 응답에는 `ON_SALE`/`SOLD_OUT`만** 나온다. `DRAFT`/`HIDDEN` 상세 접근은 `404`.
- 정렬 API enum: `POPULAR`, `NEWEST`, `WISHLIST_COUNT`, `SALES_COUNT`, `PRICE_ASC`, `PRICE_DESC`. URL 표현 ↔ enum 매핑은 [routing-and-auth.md](routing-and-auth.md) §3.
- 상세 응답에는 옵션 그룹(`REQUIRED`/`OPTIONAL`/`TEXT`), `detailPageBlocks`(`h2`/`p`/`img`/`video`), `images`(ULID + 3 variant), `artisan` 요약이 포함된다. 전체 필드는 BE `docs/장인몰_API_계약서_공개조회.md`.

### 구매자 상호작용 (USER)

| Method        | 경로                              | 용도                     |
| ------------- | --------------------------------- | ------------------------ |
| POST / DELETE | `/api/products/{productId}/wish`  | 찜 등록/취소             |
| GET           | `/api/member/me/wishes`           | 내 찜 목록               |
| GET           | `/api/member/me/reviews`          | 내가 쓴 후기             |
| GET           | `/api/member/me/reviews/writable` | 후기 작성 가능 주문 상품 |

- 상품별 후기·문의 mutation의 상세 계약은 BE 확정 후 추가(§9).

### 판매자 관리 (ARTISAN)

| Method | 경로                               | 용도                     |
| ------ | ---------------------------------- | ------------------------ |
| POST   | `/api/products`                    | 등록 (등록 직후 `DRAFT`) |
| GET    | `/api/products/me`                 | 내 상품 목록             |
| PATCH  | `/api/products/{productId}`        | 기본 정보·옵션 수정      |
| PATCH  | `/api/products/{productId}/status` | 판매 상태 변경           |
| DELETE | `/api/products/{productId}`        | 삭제                     |

승인된 상세 콘텐츠를 게시하면 `ON_SALE`로 전환되어 공개 조회 대상이 된다.

## 6. AI 상세 콘텐츠 도메인 (ARTISAN)

콘텐츠 상태: `DRAFT` → `PENDING_REVIEW` → `APPROVED` / `REJECTED` → `PUBLISHED`.

| Method | 경로                                                           | 용도                                               |
| ------ | -------------------------------------------------------------- | -------------------------------------------------- |
| POST   | `/api/content/products/{productId}/interview`                  | 취재 데이터 등록                                   |
| POST   | `/api/content/products/{productId}/generations`                | AI 생성 요청 (비동기, `202`)                       |
| GET    | `/api/content/products/{productId}/generations/{generationId}` | 생성 상태 조회 (`PROCESSING`/`COMPLETED`/`FAILED`) |
| GET    | `/api/content/products/{productId}/contents`                   | 생성 초안 조회                                     |
| PATCH  | `/api/content/products/{productId}/contents/{contentId}`       | 문단 일괄 수정                                     |
| GET    | `/api/content/products/{productId}/contents/versions`          | 변경 이력                                          |
| POST   | `.../contents/{contentId}/approve`                             | 사실·사진 확인 후 승인                             |
| POST   | `.../contents/{contentId}/reject`                              | 반려 사유와 함께 반려                              |
| POST   | `/api/content/products/{productId}/publish`                    | 게시 + 상품 `ON_SALE` 전환                         |

- 생성 요청: `images`(imageId 3~12장), `productName`, `howMade`, `careTips`.
- **생성은 비동기.** FE는 `generations/{id}` 폴링으로 `COMPLETED` 확인. `FAILED`면 재시도 CTA. 재생성은 동일 엔드포인트 재호출.
- 응답 블록 구조: `{ order, tag(h2/p/img/video), text, imageUrl }`.
- 문단·사진 상세 DTO, interview↔generation 데이터 소유 관계, 여러 버전 중 publish 대상 선택 규칙은 미확정(§9). AI 상세 화면 구조는 이 계약 확정 후 설계.

## 7. 챗봇 도메인 (Public)

| Method | 경로                                         | 용도                                        |
| ------ | -------------------------------------------- | ------------------------------------------- |
| POST   | `/api/chatbot/sessions`                      | 세션 생성 (`sessionId`, `expiresInSeconds`) |
| POST   | `/api/chatbot/sessions/{sessionId}/messages` | 메시지 전송                                 |

- 호출 구조는 FE → BE 단방향. FE는 BE 챗봇 API만 호출한다(AI 서버 직접 호출 없음).
- 입력: `message`(소비자 자연어 원문, 가공 없이 전달).
- 응답: `reply`(항상 존재), `intent`, `suggestions`(최대 3), `products`(카드 배열, 각 `reason` 포함).
- **`products: []`는 에러가 아니라 정상 응답.** AI 불가 시 BE가 fallback `reply`를 주므로 FE는 에러 모달 없이 안내 문구를 표시한다. (`errorCode: AI_UNAVAILABLE`는 BE 내부 5xx 처리이며 FE는 fallback `reply` 경로를 우선.)
- 응답 지연 허용 30초.

## 8. 장인 · 회원 · 결제 도메인

### 장인

| 구분                | 엔드포인트                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 공개 조회           | `GET /api/member/artisans`, `GET /api/member/artisans/{artisanId}`                                                                                            |
| 목록 query          | 페이지네이션 파라미터(§2.4), `certificationLevel`(다중), `category`(다중), `initial`(초성, 채택 미확정), `sort`                                               |
| 목록 sort           | `POPULAR`, `MOST_PRODUCTS`, `RECENTLY_JOINED`                                                                                                                 |
| 장인 관리 (ARTISAN) | `GET\|PATCH /api/member/artisans/me`, `POST /api/member/artisans/applications`, `GET /api/member/artisans/applications/me`                                    |
| 구독 (USER)         | `POST\|DELETE /api/member/artisans/{artisanId}/subscribe`, `GET /api/member/artisans/subscriptions`, `PATCH /api/member/artisans/subscriptions/notifications` |
| 관리자 심사 (ADMIN) | 직접 처리 `GET/POST /api/admin/seller-applications...` + 4단계 pipeline `PATCH /api/admin/artisans/applications/{id}/pipeline`                                |

- `certificationLevel` 값: `보유자`, `전승교육사`, `이수자`, `일반`.
- 관리자 심사는 두 흐름이 명세에 공존한다. FE는 두 API를 동일한 상태 전이로 가정하지 않는다(§9).

### 회원 · 인증

| 구분 | 엔드포인트                                                                                                                                                                                                                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 인증 | `POST /api/member/signup`, `POST /api/member/email-verifications`, `GET /api/member/email-verifications/verify`, `GET /api/member/oauth2/{kakao\|google}`, `POST /api/member/oauth2/complete-profile`, `POST /api/member/login`, `POST /api/member/logout`, `POST /api/member/token/refresh`                                                                 |
| 회원 | `GET\|PATCH\|DELETE /api/member/me`, `PATCH /api/member/me/password`, `GET\|POST /api/member/me/addresses`, `PATCH\|DELETE /api/member/me/addresses/{addressId}`, `GET /api/member/me/orders`, `GET /api/member/me/orders/{orderId}`, `GET\|POST\|DELETE /api/member/recent-views`, `POST /api/member/recent-views/merge`, `GET\|PATCH /api/member/settings` |

- 인증 라이프사이클(토큰 저장·refresh·로그아웃)은 [routing-and-auth.md](routing-and-auth.md) §4.
- login·refresh 응답에 user 정보가 포함되는지는 미확정(§9).

### 장바구니 · 주문 · 결제

| 구분      | 엔드포인트                                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 장바구니  | `GET /api/payments/cart`, `POST /api/payments/cart/items`, `PATCH\|DELETE /api/payments/cart/items/{cartItemId}`, `PATCH /api/payments/cart/items/{cartItemId}/options`, `POST /api/payments/cart/merge` |
| 주문·결제 | `POST /api/payments/orders`, `POST /api/payments`(결제 준비), `POST /api/payments/confirm`, `POST /api/payments/fail`, `POST /api/payments/{paymentId}/cancel`, `POST /api/payments/returns`             |
| 배송      | `GET /api/payments/orders/{orderId}/delivery`                                                                                                                                                            |
| 이미지    | `POST /api/images/presigned-url` — imageId별 320w/640w/1280w WebP variant 업로드 URL 발급, 5분 유효                                                                                                      |

- 게스트 장바구니는 클라이언트 localStorage로 관리한다(쿠키 아님). 로그인 시 `POST /api/payments/cart/merge`에 `guestCartItems: [{ productId, quantity, selectedOptions }]` 배열을 전달해 병합한다(동일 상품 수량 합산). PHASE2-1 §5-8 기준.
- **결제 완료는 결제 SDK 클라이언트 결과만으로 확정하지 않는다.** `POST /api/payments`로 `paymentId` + `tossClientKey`를 받아 위젯을 마운트하고, 결제 후 `paymentKey`/`orderId`/`amount`를 `POST /api/payments/confirm`에 전달한다. **결제 승인 API의 성공 응답을 기준으로** 주문 완료·주문 목록을 갱신한다.
- 주문 상태: `CREATED`, `PAID`, `PAYMENT_FAILED`, `CANCELED`, `DELIVERED`. 반품 상태(`REQUESTED` 등)는 주문 상태와 별도 관리.
- 결제수단·환불계좌 API(`/api/payments/methods`, `/api/payments/refund-account`)는 BE `보류(추후 구현)`.
- 비밀 키가 필요한 최종 결제 승인은 BE가 담당한다. 클라이언트는 SDK 결제창·redirect만 처리.

## 9. 확인이 필요한 계약

대부분 BE REST Docs 확정 시 `api/{domain}/validation.ts`·폼 스키마에, PM enum 확정 시 `constants/`에 반영된다. FE 구현 blocking은 아니다.

| 항목                         | 확인 내용                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| errorCode 목록 정합          | `ErrorCode.java` ↔ `장인몰_API_계약서_공개조회.md`(§0-4) ↔ `PHASE2-1` 간 불일치 (`EXPIRED` vs `RESOURCE_EXPIRED`, `MISMATCH` 미반영, `TOKEN_*`). BE 단일화. FE는 `code: string` unknown-safe로 흡수 중 |
| 페이지네이션 파라미터·응답   | `page`/`offset` 추가 요청 발신. 최종 파라미터·응답 형태 (§2.4)                                                                                                                                         |
| 게스트 장바구니 저장 방식    | PHASE2-2(쿠키 기반) vs PHASE2-1 §5-8(localStorage + `guestCartItems`) 불일치. FE는 PHASE2-1 상세 계약 기준 localStorage 채택. BE 확정 필요                                                             |
| login·refresh 응답 user 포함 | 응답 `data`에 `{ accessToken, user }` 포함 여부. 현재 FE는 `GET /api/member/me` 추가 호출 가정                                                                                                         |
| `giftTheme` 영문 코드값      | `HOUSEWARMING` 등 BE 임의 지정 — PM 확정                                                                                                                                                               |
| `color` 전체 목록            | PM 자료 "등" 표기 — 확정 목록 재확인                                                                                                                                                                   |
| `initial`(초성 필터)         | 최종 채택 여부                                                                                                                                                                                         |
| `keyword` 최대 길이          | 미정                                                                                                                                                                                                   |
| `category`/`material` 유효성 | 잘못된 값 → 400 vs 빈 결과                                                                                                                                                                             |
| AI 콘텐츠 DTO                | 문단·사진 구조, 버전 선택, publish 대상 확정                                                                                                                                                           |
| AI interview/generation      | 데이터 소유·갱신 규칙                                                                                                                                                                                  |
| 장인 심사 흐름               | 직접 승인/반려 vs 4단계 pipeline 단일화                                                                                                                                                                |
| 상품 상태 변경               | `status` 요청 본문 필수 여부·허용 전이                                                                                                                                                                 |
| 후기·문의 mutation           | 상품별 후기·문의 작성/답변 상세 계약                                                                                                                                                                   |
