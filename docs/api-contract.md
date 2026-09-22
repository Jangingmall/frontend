# API 계약 (FE 파생)

> **2026-09-22 연동 갱신**: [소비자 실제 API 연동](consumer-real-api-integration.md)에 최신 계약, 연결 범위와 미검증 항목을 정리했습니다. 아래의 과거 placeholder 설명과 다르면 갱신 문서를 기준으로 합니다.

> **원본**: BE 레포([Jangingmall/backend](https://github.com/Jangingmall/backend)) `docs/PHASE2-1_API_협업_계약서.md`, `docs/API_공통규칙.md`, `docs/예외_설계.md`, `docs/장인몰_API_계약서_공개조회.md`, `docs/PHASE2-2_인증_정책_계약서.md`, `docs/PHASE2-3_AI_통합_계약서.md`, `global/exception/ErrorCode.java` / 노션 [FE API 연동 계약](https://app.notion.com/p/API-3c29e3e335cc80d08a26e8b864d43f7f)
> **기준일**: 2026-09-08
> **상태**: 재구성 초안 (BE member/payment 모듈 미구현 — 엔드포인트 맵 수준)
> **관련 문서**: [data-layer.md](data-layer.md) · [routing-and-auth.md](routing-and-auth.md) · [isr.md](isr.md)

## 1. 사용 원칙

> 2026-09-17 상품 목록 후속: [PL-2·PL-3 실제 API 연결 준비](product-list-api-integration.md). Spring Page 변환과 운영 활성화 조건은 이 후속 문서를 따른다. BE·인프라 실서버 검증은 미완료다.

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
- 이미지: `imageId`(ULID) + `variants` 배열. `format: webp` 고정. variant 구성은 **`purpose`마다 다르다**(§8) — 공개 이미지(`PRODUCT` 등)는 320w / 640w / 1280w 3종, `RETURN`은 1280w 1종.

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

- FE는 `user.role: Role` **단일 값**으로 판단한다(판매자는 `"ARTISAN"` 하나 — 배열 아님). BE `MemberProfileResponse.role`이 `MemberRole` 단일 enum이라는 걸 2026-09-15 BE 레포(`Jangingmall/backend`) 직접 대조로 확인했다. `MemberRole.authorities`(`ARTISAN` → `["ROLE_USER","ROLE_ARTISAN"]`)는 Spring Security 내부 권한 문자열일 뿐 응답 DTO 필드로 노출되지 않는다. 라우트 가드는 [routing-and-auth.md](routing-and-auth.md) §5.
- API별 인증 수준(`Public` / `Public(게스트)` / `Authenticated` / `USER` / `ARTISAN` / `ADMIN`)은 BE `PHASE2-2` §5 표 기준.

## 4. 호출 계층

```
컴포넌트 → TanStack Query hook → 도메인 API 함수 → 공통 fetcher → DTO 검증·변환 → 화면용 도메인 모델
```

컴포넌트는 URL·method·응답 래퍼·인증 헤더를 직접 다루지 않는다. Query hook은 cache key·무효화, API 함수는 endpoint·변환을 담당한다.

## 5. 상품 도메인

### PL-2·PL-3·PD-1 현재 연결 (2026-09-17, #55)

현재 BE 컨트롤러·DTO를 기준으로 FE를 조정했다. 이전 명세의 필터/정렬 enum/중첩 확장 DTO를 실제 계약으로 가정하지 않는다. [현재 BE API 연동](product-list-api-integration.md)에 요청·응답·변환·보류 조건을 모았다.

| Method      | 경로                              | 현재 사용                                                                                                                                                                                                        |
| ----------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET         | `/api/products`                   | Pageable, ON_SALE. 지원 속성의 FE 필터는 전체 페이지 수집 후 처리                                                                                                                                                |
| GET         | `/api/products/categories`        | categoryId/name                                                                                                                                                                                                  |
| GET         | `/api/products/subcategories`     | subcategoryId/categoryId/name, 하위 품목                                                                                                                                                                         |
| GET         | `/api/products/{id}`              | 기본 정보·재고·썸네일·productionPeriodDays                                                                                                                                                                       |
| GET         | `/api/member/artisans/{id}`       | 공개 장인 요약                                                                                                                                                                                                   |
| GET         | `/api/products/{id}/reviews`      | Spring Page, createdAt/rating 정렬                                                                                                                                                                               |
| POST        | `/api/products/{id}/reviews`      | 후기 작성(USER만, ARTISAN 403). `orderItemId`·`rating`(정수 1~5)·`content`(최대 2000자)·`images?`(최대 5장). 주문 아이템당 1개만 허용(중복 시 `BUSINESS_RULE_VIOLATION`)                                         |
| GET         | `/api/member/me/reviews`          | 내가 작성한 후기, Spring Page. `orderItemId`·`productName`·`thumbnailUrl`·실제 첨부 이미지는 아직 안 내려준다(be-requests.md #11)                                                                                |
| GET         | `/api/member/me/reviews/writable` | 리뷰 미작성 + DELIVERED 주문 아이템, Spring Page. `options`(#8과 같은 원인)·`purchasedAt`·`rewardPoints`(적립금 도메인 자체 없음)는 아직 안 내려준다(#11)                                                        |
| GET         | `/api/member/me/wishes`           | 찜 목록, Spring Page(번호 기반). **2026-09-21 BE 레포 직접 대조로 정정** — 이전엔 cursor 기반(`nextCursor`/`hasNext`)으로 적혀 있었으나 실제 `MemberQueryController#wishes`는 다른 목록 API와 같은 Page 기반이다 |
| GET         | `/api/member/me/wishes/{id}`      | 상품 하나의 찜 여부만 확인(`MemberQueryController#isWished`). **공통 응답 봉투를 안 쓴다** — `ResponseEntity<Void>`를 그대로 리턴해 204(찜함)/404(안함)만 온다. 이전 계약 문서엔 없던 엔드포인트                 |
| POST/DELETE | `/api/products/{id}/wish`         | 인증된 찜 등록/취소                                                                                                                                                                                              |
| POST        | `/api/products/{id}/questions`    | content(최대 1000자), secret:false                                                                                                                                                                               |
| POST        | `/api/payments/cart/items`        | 어댑터 구현, UI는 옵션 확인 전 비활성                                                                                                                                                                            |

- 목록/후기는 page - 1과 size를 전송하며 Spring Page를 검증한다. 인기·판매·찜 정렬 및 종목 필터는 실제 모드에서 숨긴다. 소재·선물 포장 UI는 Figma대로 표시하고 선택을 URL에 보존하되 실제 API 요청에는 전송하지 않는다. MSW 확장은 시연 전용이다.
- 상세의 DRAFT/HIDDEN은 FE에서 404로 처리한다. 직접 BE 접근의 상태 제한은 미해결이다.
- 문의 목록 GET과 비밀문의 등록은 답변 노출 문제가 해결될 때까지 보류한다. 공개 문의만 등록한다.
- 장바구니는 숫자 옵션 ID와 단일 조합을 검증한다. 상품 DTO의 옵션 누락을 옵션 없음으로 간주하지 않으며, UI 비활성/서버 SQL 불일치 확인 사항은 연결 문서에 기록한다.
- 재입고 알림 API는 없어 실제 모드에서 보류한다.

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

| 구분 | 엔드포인트                                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 인증 | `POST /api/member/signup`, `POST /api/member/email-verifications`, `GET /api/member/email-verifications/verify`, `GET /api/member/oauth2/{naver\|kakao}`, `POST /api/member/oauth2/complete-profile`, `POST /api/member/login`, `POST /api/member/logout`, `POST /api/member/token/refresh`                                                                                                       |
| 회원 | `GET\|PATCH\|DELETE /api/member/me`, `PATCH /api/member/me/password`, `GET\|POST /api/member/me/addresses`, `PATCH\|DELETE /api/member/me/addresses/{addressId}`, `GET /api/member/me/orders`, `GET /api/member/me/orders/{orderId}`, `GET /api/member/me/orders/summary`, `GET\|POST\|DELETE /api/member/recent-views`, `POST /api/member/recent-views/merge`, `GET\|PATCH /api/member/settings` |

- 인증 라이프사이클(토큰 저장·refresh·로그아웃)은 [routing-and-auth.md](routing-and-auth.md) §4.
- **로그인 응답엔 `{ accessToken, member }`가 함께 온다**(2026-09-15 BE 레포 직접 대조로 확정). `POST /token/refresh`는 `member` 없이 `{ accessToken, expiresIn }`뿐이다.

### 장바구니 · 주문 · 결제

| 구분      | 엔드포인트                                                                                                                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 장바구니  | `GET /api/payments/cart`, `POST /api/payments/cart/items`, `PATCH\|DELETE /api/payments/cart/items/{cartItemId}`, `PATCH /api/payments/cart/items/{cartItemId}/options`, `POST /api/payments/cart/merge`                      |
| 주문·결제 | `POST /api/payments/orders`, `POST /api/payments`(결제 준비), `POST /api/payments/confirm`, `POST /api/payments/fail`, `POST /api/payments/{paymentId}/cancel`, `POST /api/payments/returns`                                  |
| 배송      | `GET /api/payments/orders/{orderId}/delivery`                                                                                                                                                                                 |
| 이미지    | `POST /api/images/presigned-url` — imageId별 WebP variant 업로드 URL 발급, 5분 유효. 목적(`purpose`)마다 필요한 variant가 다르다: `PRODUCT` 등 공개 이미지는 320w/640w/1280w 3종, `RETURN`(취소·교환·환불 사진)은 1280w 1종만 |

- 게스트 장바구니는 클라이언트 localStorage로 관리한다(쿠키 아님). 로그인 시 `POST /api/payments/cart/merge`에 `guestCartItems: [{ productId, quantity, selectedOptions }]` 배열을 전달해 병합한다(동일 상품 수량 합산). PHASE2-1 §5-8 기준.
- **결제 완료는 결제 SDK 클라이언트 결과만으로 확정하지 않는다.** `POST /api/payments`로 `paymentId` + `tossClientKey`를 받아 위젯을 마운트하고, 결제 후 `paymentKey`/`orderId`/`amount`를 `POST /api/payments/confirm`에 전달한다. **결제 승인 API의 성공 응답을 기준으로** 주문 완료·주문 목록을 갱신한다.
- 주문 상태: `CREATED`, `PAID`, `PAYMENT_FAILED`, `CANCELED`, `DELIVERED`. 반품 상태(`REQUESTED` 등)는 주문 상태와 별도 관리.
- 결제수단·환불계좌 API(`/api/payments/methods`, `/api/payments/refund-account`)는 BE `보류(추후 구현)`.
- 비밀 키가 필요한 최종 결제 승인은 BE가 담당한다. 클라이언트는 SDK 결제창·redirect만 처리.

## 9. 확인이 필요한 계약

대부분 BE REST Docs 확정 시 `api/{domain}/validation.ts`·폼 스키마에, PM enum 확정 시 `constants/`에 반영된다. FE 구현 blocking은 아니다.

| 항목                         | 확인 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| errorCode 목록 정합          | `ErrorCode.java` ↔ `장인몰_API_계약서_공개조회.md`(§0-4) ↔ `PHASE2-1` 간 불일치 (`EXPIRED` vs `RESOURCE_EXPIRED`, `MISMATCH` 미반영, `TOKEN_*`). BE 단일화. FE는 `code: string` unknown-safe로 흡수 중                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 페이지네이션 파라미터·응답   | 상품 목록/후기는 현재 Spring Pageable과 Page로 연동한다. 다른 도메인의 cursor 계약과 구분한다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 게스트 장바구니 저장 방식    | PHASE2-2(쿠키 기반) vs PHASE2-1 §5-8(localStorage + `guestCartItems`) 불일치. FE는 PHASE2-1 상세 계약 기준 localStorage 채택. BE 확정 필요                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `giftTheme` 영문 코드값      | `HOUSEWARMING` 등 BE 임의 지정 — PM 확정                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `color` 전체 목록            | PM 자료 "등" 표기 — 확정 목록 재확인                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `initial`(초성 필터)         | 최종 채택 여부                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `keyword` 최대 길이          | 미정                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `category`/`material` 유효성 | 실제 분류 ID를 사용하며 GNB 쓰임 분류와 추정 매핑하지 않는다. 소재·공예 종목은 현재 연결 범위에서 제외한다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| AI 콘텐츠 DTO                | 문단·사진 구조, 버전 선택, publish 대상 확정                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| AI interview/generation      | 데이터 소유·갱신 규칙                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 장인 심사 흐름               | 직접 승인/반려 vs 4단계 pipeline 단일화                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 상품 상태 변경               | `status` 요청 본문 필수 여부·허용 전이                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 공개 상품 상태 제한          | BE 상세 조회의 `DRAFT`/`HIDDEN` → `404` 처리 및 `ON_SALE`/`SOLD_OUT` 조회 유지, 목록의 품절 포함 정책 확정·회귀 검증. 현재 FE의 상태 차단을 BE 접근 제어 완료로 간주하지 않는다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 후기·문의 mutation           | 공개 문의 content/secret POST는 구현했다. 비밀문의 답변 접근 제어 문제로 목록 조회/비밀글 작성은 보류한다. **후기 작성은 마이페이지 "내가 쓴 후기" 화면(`/mypage/reviews`)에서 실제 계약대로 구현했다**(§5). 후기 수정·삭제는 대응 API가 없다. "내가 작성한 후기"·"후기 미작성 상품" 목록 조회는 `GET /api/member/me/reviews`·`GET /api/member/me/reviews/writable`로 **BE에 이미 있다**(2026-09-21 BE 레포 직접 대조로 확인 — 이전에 이 문서가 "대응 엔드포인트 없음"이라고 적어둔 건 틀린 내용이었다, §5). 다만 두 응답 모두 화면이 쓰는 필드 일부가 빠져 있어 mock이 목표 계약대로 채워 보여준다(be-requests.md #11). 별점도 Figma는 0.5 단위인데 BE는 정수 1~5만 받는다(0.5 단위 지원 요청함, be-requests.md #10).                                                                                                                                                                                                                                                                                 |
| OAuth 제공자 미구현          | 디자인·기획은 네이버·카카오(구글 제외)로 확정. `PHASE2-2_인증_정책_계약서.md` 기준 BE는 카카오·구글만 구현, 네이버 엔드포인트 자체가 없음(`NaverLoginButton.tsx` 확인). BE가 네이버 OAuth2를 추가해야 함 — PM 전달 대기                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| OAuth 목업·실제 계약 괴리    | BE 레포(`OAuthController`·`OAuthMemberService`·`OAuthIdentity`) 직접 대조로 확인된 차이 3가지. **(1) 시작 경로는 불일치가 아니었다** — `GET /api/member/oauth2/{provider}`는 실제 존재하는 자체 엔드포인트이고 `/oauth2/authorization/{provider}`(Spring Security 프레임워크 경로)로 302 리다이렉트하는 한 단계일 뿐이다. **(2) `complete-profile` 요청 바디는 `{name, phone, agreements}`뿐**이고 `email`·`provider`가 없다 — 신원은 `exchange` 단계에서 발급된 쿠키 기반 티켓(`oauthOnboarding`)으로 서버가 식별한다. 목업은 이 쿠키·티켓 체인을 흉내낼 수 없어(리다이렉트 기반) 클라이언트가 `provider`·`email`을 명시적으로 보내는 단순화된 계약을 쓴다 — 실제 연동 시 요청 구성 로직을 다시 짜야 한다. **(3) `OAuthIdentity` 생성자가 provider가 준 이메일 형식을 강제**하고, 유효하지 않으면 흐름 전체가 즉시 `401`로 실패한다 — "이메일 미제공 시 사용자가 직접 입력" 같은 폴백 경로가 지금 BE엔 없다. 목업의 네이버(이메일 미제공) 분기는 IA 의도를 반영한 것이고 대응하는 BE 기능은 아직 없다 |

### 상품목록 필터 화면 (이슈 #73)

- 헤더의 쓰임 분류를 화면 기준으로 사용하며 API의 이름과 부모 분류가 유일하게 일치할 때만 서버 ID로 연결한다. 도자기 등의 기존 공예 분류를 쓰임 분류로 추정 변환하지 않는다.
- 분류가 아직 연결되지 않은 경우에도 소분류·가격·소재·선물 포장 UI는 표시한다. 상품 결과 영역에는 준비 상태를 표시하고 다른 분류 상품을 대신 표시하지 않는다.
- 소재 API 미지원/선택지 부재 시 `소재 1~6`은 Figma 화면 확인용 선택지다. 실제 필터링 기능을 의미하지 않는다.
