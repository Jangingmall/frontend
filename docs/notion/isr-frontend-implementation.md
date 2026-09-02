# Next.js ISR 재검증 — 프론트엔드 구현 설계

- 원본: https://app.notion.com/p/3cfecddcc9cb8030b458ffec025c03e2
- 문서 상태: 초안
- 정리 기준일: 2026-09-02

## 목적과 범위

공개 상품·장인 데이터는 Next.js 서버 데이터 캐시(ISR)로 제공하고, 백엔드의 콘텐츠 변경 이벤트가 도착하면 해당 데이터의 cache tag를 stale 처리한다. 장바구니·주문·결제·내 정보처럼 사용자별 인증 데이터와 판매자 작성 중 상태는 ISR 대상이 아니다. 이 데이터는 TanStack Query와 로컬 UI 상태로 관리한다.

## 캐시 원칙

- 재검증 단위는 URL이나 화면이 아니라 공개 데이터다.
- 백엔드는 이벤트와 리소스 ID만 전달한다. cache tag와 페이지 경로는 프론트엔드 내부 세부 사항이다.
- 공개 서버 요청만 next.tags 및 next.revalidate를 부여한다.
- 목록은 필터·정렬·cursor 조합을 모두 포괄하도록 공통 컬렉션 태그를 사용한다.
- cookies나 인증 헤더처럼 요청별 값에 의존하는 공개 API는 ISR 캐시를 사용하지 않는다.
- 시간 기반 revalidate는 웹훅 유실에 대비한 안전망이며, 주된 갱신 수단은 이벤트 기반 태그 재검증이다.

## 태그 계약

| 태그 | 적용 대상 | 변경 시 재검증 |
| --- | --- | --- |
| products | 모든 공개 상품 목록·검색·필터 결과 | 공개 상품 생성·수정·상태 변경·삭제·게시 |
| product:{productId} | 상품 상세 | 해당 상품 공개 데이터 변경 |
| product-artisan | 상품 상세에 포함된 장인 소개 | 장인 공개 프로필 변경 |
| product-taxonomy | 카테고리·소재 | 분류 데이터 변경 |
| artisans | 공개 장인 목록 | 장인 공개 상태·목록 표현 변경 |
| artisan:{artisanId} | 장인 상세 | 해당 장인 프로필 변경 |

상품 상세에 장인 ID가 포함되기 전에는 알 수 없으므로 product-artisan 공통 태그를 둔다. 장인 프로필 변경은 상품 상세 캐시를 넓게 stale 처리할 수 있지만, 정합성을 우선한다.

## 요청 계층

~~~text
Server Component 또는 서버 데이터 함수
  → 도메인 API 함수
    → fetchPublicApi 또는 fetchPrivateApi
      → 공통 apiFetch
        → Spring REST API
~~~

- apiFetch는 base URL 결합, 공통 헤더, HTTP 오류 변환, 성공 응답 래퍼 파싱만 담당한다.
- fetchPublicApi는 next.tags와 next.revalidate를 추가한다.
- fetchPrivateApi는 cache: no-store를 사용한다.
- TanStack Query 브라우저 캐시와 Next.js 서버 ISR 캐시는 독립적이다. 판매자가 수정 요청에 성공하면 현재 브라우저의 Query를 무효화하고, 백엔드 웹훅은 공개 서버 캐시를 stale 처리한다.

## 재검증 웹훅

- 위치: src/app/api/revalidate/route.ts
- 메서드: POST
- 런타임: Node.js
- 검증 순서: raw body 읽기 → timestamp 허용 범위 확인 → HMAC-SHA256 계산과 timing-safe 비교 → JSON DTO 검증 → 이벤트별 태그 계산 → revalidateTag 호출
- 원본 body는 한 번만 읽는다. 서명 검증 전에는 request.json()을 호출하지 않는다.
- 타임스탬프 허용 범위는 5분이다.
- 중복 전달과 재시도는 별도 DB 없이 안전하게 허용한다.
- 401은 인증 오류, 400은 이벤트 계약 오류, 예외는 500으로 응답한다. 로그에는 eventId와 이벤트명만 남기고 시크릿·서명·원문 body는 남기지 않는다.

## 이벤트별 태그

| 이벤트 | 재검증 태그 |
| --- | --- |
| product.updated | product:{productId}, products |
| product.statusChanged | product:{productId}, products |
| product.deleted | product:{productId}, products |
| product.contentPublished | product:{productId}, products |
| artisan.updated | artisan:{artisanId}, artisans, product-artisan, products |
| artisan.statusChanged | artisan:{artisanId}, artisans, product-artisan |

product.created는 상품이 기본적으로 DRAFT이며 공개 API에 노출되지 않는다는 전제에서 공개 태그를 재검증하지 않는다.

## 환경 변수와 운영

| 변수 | 용도 | 노출 |
| --- | --- | --- |
| API_BASE_URL | Spring REST API 기본 URL | 서버 전용 |
| REVALIDATE_WEBHOOK_SECRET | HMAC 공유 시크릿 | 서버 전용 |

환경별 URL과 시크릿은 별도로 관리한다. 백엔드에는 각 환경의 FE 도메인/api/revalidate 주소와 해당 시크릿을 안전한 채널로 전달한다. 네트워크 오류·429·5xx는 백엔드 재시도 대상이고, 400·401은 계약 또는 인증 설정을 수정해야 한다.

## 구현 전 확인 사항

- 이 문서에는 게시 API가 api/content/products/{productId}/publish로 기록돼 있다. 백엔드 연동 계약에는 api/content/products/{productId}/contents/{contentId}/publish가 기록되어 있으므로, 실제 엔드포인트를 백엔드와 확정해야 한다.
- 리뷰·문의·찜 수·판매량처럼 빈번하게 변하는 데이터는 ISR 태그에 아직 포함하지 않는다.
- 카테고리·소재가 ISR 대상인지와 재검증 간격은 실제 공개 조회 계약에 맞춰 확정한다.

