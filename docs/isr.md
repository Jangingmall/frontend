# ISR 재검증

> **원본**: 노션 [ISR 재검증 — 프론트엔드 구현 설계](https://app.notion.com/p/3cfecddcc9cb8030b458ffec025c03e2) + [ISR 재검증 — 백엔드 연동 계약](https://app.notion.com/p/3cfecddcc9cb807eadf8d66dc2945463)
> **기준일**: 2026-09-08
> **상태**: 재구성 초안 (구현 반영: `src/lib/isr/`, `src/app/api/revalidate/`)
> **관련 문서**: [data-layer.md](data-layer.md) · [api-contract.md](api-contract.md) · [routing-and-auth.md](routing-and-auth.md) · [architecture.md](architecture.md)

## 1. 범위

- **공개 상품·장인 데이터만 ISR 대상.** Next.js 서버 데이터 캐시로 제공하고, 백엔드 콘텐츠 변경 이벤트가 도착하면 해당 cache tag를 stale 처리한다.
- 장바구니·주문·결제·내 정보 등 사용자별 인증 데이터와 판매자 작성 중 상태는 ISR 대상이 **아니다.** TanStack Query와 로컬 UI 상태로 관리한다(→ [data-layer.md](data-layer.md)).

## 2. 캐시 원칙

- 재검증 단위는 URL·화면이 아니라 **공개 데이터**다.
- 백엔드는 이벤트와 리소스 ID만 전달한다. cache tag와 페이지 경로는 프론트엔드 내부 세부 사항이다.
- 공개 서버 요청만 `next.tags` / `next.revalidate`를 부여한다.
- 목록은 필터·정렬·page 조합을 모두 포괄하도록 공통 컬렉션 태그(`products`, `artisans`)를 사용한다. 페이지 번호가 달라도 같은 컬렉션 태그를 공유한다.
- cookies·인증 헤더처럼 요청별 값에 의존하는 API는 ISR 캐시를 쓰지 않는다.
- 시간 기반 `revalidate`는 이벤트가 있는 데이터(상품·장인)에서는 웹훅 유실 대비 안전망이다. 이벤트가 없는 데이터(필터 옵션 목록, §8)에서는 유일한 갱신 수단이며 짧게 잡지 않고 하루 단위로 둔다.
- 리뷰·문의 목록, 실시간 집계는 ISR 대상이 아니다. 클라이언트에서 조회한다(→ [data-layer.md](data-layer.md)). 목록·상세 응답에 포함된 집계 숫자(`rating` 등)는 `products` 캐시에 담겨 `revalidate` 지연만큼 stale해질 수 있으나 무해하다.
- TanStack Query 브라우저 캐시와 Next.js 서버 ISR 캐시는 독립적이다. 판매자 수정 성공 시 현재 브라우저의 Query를 무효화하고(→ [data-layer.md](data-layer.md) §6.6), 백엔드 웹훅은 공개 서버 캐시를 stale 처리한다.

## 3. 태그 계약

| 태그                  | 적용 대상                                    | 변경 시 재검증                                                                                                                           |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `products`            | 모든 공개 상품 목록·검색·필터 결과           | 공개 상품 생성·수정·상태 변경·삭제·게시                                                                                                  |
| `product:{productId}` | 상품 상세                                    | 해당 상품 공개 데이터 변경                                                                                                               |
| `product-artisan`     | 상품 상세에 포함된 장인 소개                 | 장인 공개 프로필 변경                                                                                                                    |
| `product-taxonomy`    | 필터 옵션 목록 (`/categories`, `/materials`) | 트리거 이벤트 없음 → `revalidate: 86400`(하루) time-based로만 갱신. BE가 `taxonomy.updated` 이벤트를 추가하면 이벤트 기반으로 전환 (§10) |
| `artisans`            | 공개 장인 목록                               | 장인 공개 상태·목록 표현 변경                                                                                                            |
| `artisan:{artisanId}` | 장인 상세                                    | 해당 장인 프로필 변경                                                                                                                    |

- 상품 상세에 장인 ID가 포함되기 전에는 알 수 없으므로 `product-artisan` 공통 태그를 둔다. 장인 프로필 변경이 상품 상세 캐시를 넓게 stale 처리할 수 있지만 정합성을 우선한다.
- **태그 문자열은 `lib/isr/tags.ts`의 팩토리 한 곳에서 생성**하고, 재검증 웹훅과 서버 데이터 조회 함수가 공유한다. (현재 `revalidation.ts`에 인라인 — 팩토리로 추출 필요)

## 4. 요청 계층

```
Server Component / 서버 데이터 조회 함수
  → 도메인 API 함수 (api/{domain}/)
    → fetchPublicApi (next.tags + next.revalidate) 또는 fetchPrivateApi (no-store)
      → apiFetch (base URL 결합, 공통 헤더, 오류 변환, 성공 래퍼 파싱)
        → Spring REST API
```

- `apiFetch`는 base URL 결합·공통 헤더·HTTP 오류 변환·성공 응답 래퍼 파싱만 담당한다. ISR 태그를 직접 알지 않는다.
- `fetchPublicApi(path, { tags, revalidate })` — ISR 태그 조회. **서버 데이터 조회 코드만** 태그를 부여한다.
- `fetchPrivateApi(path)` — `cache: "no-store"`. 요청마다 신선해야 하는 공개 조회에 한정한다(인증 조회는 클라이언트에서 — [routing-and-auth.md](routing-and-auth.md) §4).
- `POST /api/revalidate`는 일반 REST proxy·BFF가 아니다. 백엔드 변경 이벤트에 대응해 `revalidateTag`를 호출하는 webhook route handler다. 재검증 endpoint와 서버 조회 코드는 tag 명명 계약만 공유하고 서로의 호출 로직에 의존하지 않는다.

## 5. 재검증 웹훅 — 호출 규약

§5.1·§5.2는 **FE가 정의한 요청 규약**이며 `src/lib/isr/revalidation.ts`에 검증 로직이 구현돼 있다. 이 규약대로 호출하면 BE 구현 방식과 무관하게 동작한다. 백엔드가 이 규약대로 호출하기로 합의·구현했는지는 아직 BE 레포에서 확인되지 않았다(§10).

백엔드는 도메인 변경 커밋 후 재검증 이벤트와 최소 식별자를 전달한다. cache tag·FE 페이지 경로·화면 이름·Next.js 호출 정보는 요청에 넣지 않는다.

| 항목         | 값                                  |
| ------------ | ----------------------------------- |
| Method       | `POST`                              |
| Endpoint     | 환경별 `{FE 도메인}/api/revalidate` |
| Content-Type | `application/json`                  |
| 전송 시점    | 도메인 변경 트랜잭션 커밋 후        |

### 5.1 HMAC 헤더

```
X-Revalidate-Timestamp: Unix epoch seconds
X-Revalidate-Signature: sha256=<HMAC_SHA256_HEX>
```

- 서명 대상은 전송하는 UTF-8 JSON 원문을 사용한 `{timestamp}.{rawRequestBody}`.
- 타임스탬프 허용 범위는 **5분**.
- 재시도는 같은 `eventId`·같은 이벤트 의미를 유지하되, 새 timestamp와 새 서명을 생성한다.

### 5.2 이벤트 DTO

```json
{
  "event": "product.contentPublished",
  "eventId": "01J...",
  "occurredAt": "2026-08-31T12:00:00Z",
  "data": { "productId": 123 }
}
```

- `eventId`는 재시도에도 동일한 이벤트 식별자.
- `occurredAt`은 실제 도메인 변경 시각(ISO 8601 UTC).
- `data`에는 이벤트별 대상 ID만 넣는다. 리소스 ID 타입은 REST API 표현과 동일(숫자).

### 5.3 전송·재시도 — 백엔드 구현 권장 (FE 계약 아님)

전송 방식(아웃박스·크론·직접 호출)은 백엔드가 정한다. 결과 HTTP 호출이 §5.1·§5.2를 만족하면 된다. 아래는 권장 사항이다.

- 도메인 변경과 전송 대기 이벤트를 한 트랜잭션에 저장(트랜잭셔널 아웃박스)해 유실을 막는다.
- 네트워크 오류·429·5xx → 지수 백오프 재시도. 400·401·403 → 반복 재시도하지 않고 요청 계약·시크릿·환경 설정 확인.
- 재시도 한도 초과 → 실패 상태로 보존, 운영자 수동 재전송.
- 웹훅 실패는 도메인 변경 자체를 롤백하지 않는다.
- FE 측 안전망: 시간 기반 `revalidate`가 웹훅 유실 시에도 결국 캐시를 갱신한다(§2).

## 6. 재검증 웹훅 — 프론트엔드 구현

- 위치: `src/app/api/revalidate/route.ts` (`runtime = "nodejs"`), 검증 로직: `src/lib/isr/revalidation.ts`.
- **검증 순서**: raw body 읽기 → timestamp 허용 범위 확인 → HMAC-SHA256 계산·timing-safe 비교 → JSON 파싱 → Zod DTO 검증 → 이벤트별 태그 계산 → `revalidateTag` 호출.
- 원본 body는 한 번만 읽는다. 서명 검증 전에는 `request.json()`을 호출하지 않는다.
- 중복 전달·재시도는 별도 DB 없이 안전하게 허용한다(idempotent).
- **응답 상태**: timestamp·서명 오류 → `401` / JSON·DTO·필수 ID 누락 → `400` / 그 외 예외 → `500`. secret 미설정도 `500`.
- 로그에는 `eventId`와 이벤트명만 남긴다. 시크릿·서명·원문 body는 남기지 않는다.

## 7. 이벤트 → 태그 매핑

| 이벤트                     | data 필수값 | 재검증 태그                                                      |
| -------------------------- | ----------- | ---------------------------------------------------------------- |
| `product.created`          | `productId` | (없음 — 등록 직후 `DRAFT`라 공개 미노출)                         |
| `product.updated`          | `productId` | `product:{productId}`, `products`                                |
| `product.statusChanged`    | `productId` | `product:{productId}`, `products`                                |
| `product.deleted`          | `productId` | `product:{productId}`, `products`                                |
| `product.contentPublished` | `productId` | `product:{productId}`, `products`                                |
| `artisan.updated`          | `artisanId` | `artisan:{artisanId}`, `artisans`, `product-artisan`, `products` |
| `artisan.statusChanged`    | `artisanId` | `artisan:{artisanId}`, `artisans`, `product-artisan`             |

## 8. 공개 상태 (백엔드 확인 결과)

| 상품 상태  | 공개 목록·상세          | 구매 |
| ---------- | ----------------------- | ---- |
| `DRAFT`    | 비노출, 상세 접근 `404` | 불가 |
| `ON_SALE`  | 노출                    | 가능 |
| `SOLD_OUT` | 품절 표시로 노출        | 불가 |
| `HIDDEN`   | MVP 포함 여부 미정      | 미정 |

- 상품은 `DRAFT`로 시작하고 AI 상세 콘텐츠 게시 후 `ON_SALE`로 전환되어 공개된다.
- 장인은 현재 심사 상태(`PENDING`/`APPROVED`/`REJECTED`)만 존재하고 승인 후 활동 중지 필드는 없다.

## 9. 환경 변수

| 변수                        | 용도                                   | 노출      |
| --------------------------- | -------------------------------------- | --------- |
| `API_BASE_URL`              | Spring REST API 기본 URL (서버 조회용) | 서버 전용 |
| `REVALIDATE_WEBHOOK_SECRET` | HMAC 공유 시크릿                       | 서버 전용 |

- 스키마·검증은 `lib/env.ts` 단일 정의(→ [data-layer.md](data-layer.md) §9). 프로덕션은 두 값이 필수다.
- 환경별 URL·시크릿은 별도 관리한다. 백엔드에는 각 환경의 `{FE 도메인}/api/revalidate` 주소와 해당 시크릿을 안전한 채널로 전달한다.

## 10. 미확정 / 후속

webhook route는 이벤트명 + 리소스 ID만으로 태그를 계산하므로, 아래 항목들은 대부분 webhook·공개 페이지 구현을 막지 않는다.

| 항목                                | 내용                                                                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 웹훅 BE 구현·합의                   | BE 레포에 revalidate 호출·HMAC 서명·이벤트 발행 구현이나 계약 문서가 없다. 연동 착수 시 §5.1의 헤더 이름·서명 base string·이벤트명·timestamp 허용치를 BE와 대조. FE 측은 `src/lib/isr/`에 구현 완료 |
| `taxonomy.updated` 이벤트           | 필터 옵션 목록은 현재 `revalidate: 86400` time-based로만 갱신. BE가 분류 변경 이벤트를 추가하면 이벤트 기반으로 전환                                                                                |
| `artisan.statusChanged` 트리거 조건 | 직접 승인/반려 API와 4단계 pipeline이 단일 상태 전이로 통합되기 전까지 어느 호출에서 이벤트가 발생하는지 BE 확인. 관리자 심사 화면 MVP 범위 여부도 미정                                             |
| 콘텐츠 게시 대상 선택               | publish 대상 content/버전 선택 규칙은 AI 상세 화면 설계 트랙 (api-contract.md §9). webhook은 `productId`만 받아 영향 없음                                                                           |
| `HIDDEN` 상태 / 장인 활동 중지      | PM 확정 대기. 현재 FE는 둘 다 상세 접근 시 `404`로 취급 (routing R-13)                                                                                                                              |
