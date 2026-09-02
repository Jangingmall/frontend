# Next.js ISR 재검증 — 백엔드 연동 계약

- 원본: https://app.notion.com/p/3cfecddcc9cb807eadf8d66dc2945463
- 정리 기준일: 2026-09-02

## 책임 경계

백엔드는 도메인 변경이 커밋된 뒤 재검증 이벤트와 최소 식별자를 프론트엔드에 전달한다. 프론트엔드는 이벤트에 맞는 Next.js cache tag와 revalidateTag 호출을 관리한다.

백엔드 요청에 포함하지 않는 값은 cache tag, FE 페이지 경로, 화면 이름, Next.js API 호출 정보다.

## 요청 계약

| 항목         | 값                              |
| ------------ | ------------------------------- |
| Method       | POST                            |
| Endpoint     | 환경별 FE 도메인/api/revalidate |
| Content-Type | application/json                |
| 전송 시점    | 도메인 변경 DB 트랜잭션 커밋 후 |

### HMAC 헤더

```text
Content-Type: application/json
X-Revalidate-Timestamp: Unix epoch seconds
X-Revalidate-Signature: sha256=HMAC_SHA256_HEX
```

서명 대상은 실제 전송하는 UTF-8 JSON 원문을 사용한 timestamp.rawRequestBody다. 재시도는 같은 eventId와 같은 이벤트 의미를 유지하되, 새 timestamp와 해당 요청의 새 서명을 생성한다.

## 이벤트 DTO

```json
{
  "event": "product.contentPublished",
  "eventId": "01J...",
  "occurredAt": "2026-08-31T12:00:00Z",
  "data": { "productId": 123 }
}
```

- eventId는 재시도에도 동일한 이벤트 식별자다.
- occurredAt은 실제 도메인 변경 시각을 ISO 8601 UTC로 표현한다.
- data에는 이벤트별 대상 ID만 넣는다. URL과 cache tag는 넣지 않는다.
- 리소스 ID 타입은 REST API의 기존 표현과 동일하게 유지한다.

## 전송·재시도

트랜잭셔널 아웃박스 방식으로 도메인 변경과 전송 대기 이벤트를 한 트랜잭션에 저장한다. 커밋 후 비동기로 FE에 전달하고, 2xx면 완료 처리한다.

- 네트워크 오류, 429, 5xx: 지수 백오프로 재시도
- 재시도 한도 초과: 실패 상태로 보존하고 운영자가 수동 재전송 가능하게 유지
- 400, 401, 403: 반복 재시도하지 않고 요청 계약·시크릿·환경 설정을 확인
- 웹훅 실패는 상품 게시 등 도메인 변경 자체를 롤백하지 않는다.

## 이벤트 목록

| 이벤트                   | 발생 변경                   | data 필수값 |
| ------------------------ | --------------------------- | ----------- |
| product.created          | 상품 기본 정보·옵션 등록    | productId   |
| product.updated          | 상품 기본 정보·옵션 수정    | productId   |
| product.statusChanged    | 상품 상태 변경              | productId   |
| product.deleted          | 상품 삭제                   | productId   |
| product.contentPublished | 상세 콘텐츠 게시            | productId   |
| artisan.updated          | 장인 프로필·소개 수정       | artisanId   |
| artisan.statusChanged    | 장인 승인·거절 등 상태 변경 | artisanId   |

장바구니·주문·결제·회원 정보 같은 사용자별 변경은 ISR 이벤트가 아니다. 리뷰·문의·좋아요·판매량의 이벤트 추가 여부는 별도 캐시 전략에서 결정한다.

## 백엔드 확인 결과

### 상품 공개 상태

| 상태     | 공개 목록·상세          | 구매 가능 |
| -------- | ----------------------- | --------- |
| DRAFT    | 비노출, 상세 접근은 404 | 불가      |
| ON_SALE  | 노출                    | 가능      |
| SOLD_OUT | 품절 표시로 노출        | 불가      |
| HIDDEN   | MVP 포함 여부 미정      | 미정      |

상품 등록은 DRAFT로 시작하고, AI 상세 콘텐츠 게시 후 ON_SALE이 되어 공개 목록과 상세에 노출된다.

### 장인 상태

현재 장인 가입 신청 심사 상태(PENDING, APPROVED, REJECTED)만 존재한다. 승인된 장인의 활동 중지 상태 필드는 아직 없다.

### 변경 API와 공개 조회 API

- 상품 관리: POST api/products, PATCH api/products/{productId}, PATCH api/products/{productId}/status
- 콘텐츠 게시: 백엔드 답변에는 POST api/content/products/{productId}/contents/{contentId}/publish가 기재됨
- 장인 프로필: PATCH api/member/artisans/me
- 장인 심사: PATCH seller-applications/{id}/approve 또는 reject
- 공개 조회: GET api/products, GET api/products/{productId}, GET api/member/artisans, GET api/member/artisans/{artisanId}
- 목록 응답: cursor와 limit 요청, items·nextCursor·hasNext·totalCount 응답

## 프론트엔드에 필요한 선행 확인

- 콘텐츠 게시 경로는 프론트엔드 ISR 설계 문서와 서로 다르므로 최종 API 명세를 확정한다.
- HIDDEN 상태를 MVP에 포함하는지, 그리고 공개 상세 처리 방식을 정한다.
- 장인 신청 승인 후 공개 목록·상세 노출 조건을 확정한다.
- 공개 목록 필터·정렬 enum과 nullable 필드를 원본 API 명세 기준으로 계속 동기화한다.
