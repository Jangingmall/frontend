# FE API 연동 계약 정리

- 원본: https://app.notion.com/p/3cfecddcc9cb80e0804ec4d476f3698e
- 문서 상태: 초안
- 정리 기준일: 2026-09-02

## 사용 원칙

이 문서는 원본 API 명세를 대체하지 않는 프론트엔드용 파생 문서다. 엔드포인트·요청·응답 예시는 원본 명세가 기준이며, 변경 시 두 문서를 함께 갱신한다.

컴포넌트는 백엔드 DTO에 직접 의존하지 않는다. API 계층이 HTTP 응답을 검증하고 DTO를 camelCase 기반 프론트엔드 도메인 모델로 변환한다. 숫자·날짜·nullable의 의미가 불명확하면 추측해 보정하지 않고 확인 항목으로 남긴다.

## 공통 응답과 페이징

```ts
type ApiSuccess<T> = {
  success: true;
  status: number;
  data: T;
};

type ApiFailure = {
  success: false;
  status: number;
  errorCode:
    | "INVALID_INPUT"
    | "REQUEST_INVALID"
    | "REQUEST_BODY_MALFORMED"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "BUSINESS_RULE_VIOLATION"
    | "TOO_MANY_REQUESTS"
    | "INTERNAL_ERROR";
};

type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number;
};
```

목록 요청은 cursor와 limit을 사용한다. limit 기본값은 20, 최대값은 100이다. hasNext가 false이면 다음 요청을 보내지 않는다.

## 역할과 계층

| 역할    | 주요 권한                                |
| ------- | ---------------------------------------- |
| 비회원  | 공개 조회                                |
| USER    | 장바구니, 주문, 찜, 리뷰 등 구매자 기능  |
| ARTISAN | USER 권한과 상품·콘텐츠·장인 프로필 관리 |
| ADMIN   | 관리자 기능                              |

```text
컴포넌트
  → TanStack Query hook
    → 도메인 API 함수
      → 공통 fetcher
        → DTO 검증·변환
          → 화면용 도메인 모델
```

컴포넌트는 API URL·HTTP method·응답 래퍼·인증 헤더를 직접 다루지 않는다. Query hook은 cache key와 무효화를, API 함수는 endpoint와 변환을 담당한다.

## 상품 도메인

### 공개 조회

| 메서드 | 경로                                | 용도                |
| ------ | ----------------------------------- | ------------------- |
| GET    | /api/products                       | 목록·검색·필터·정렬 |
| GET    | /api/products/{productId}           | 상세                |
| GET    | /api/products/categories            | 카테고리 필터       |
| GET    | /api/products/materials             | 소재 필터           |
| GET    | /api/products/{productId}/reviews   | 리뷰 목록           |
| GET    | /api/products/{productId}/questions | 문의 목록           |

상품 목록은 artisanId, category, material, giftTheme, color, sort, 가격 범위, 한정·주문제작·포장·품절 제외 여부, keyword와 cursor pagination을 지원한다. URL의 q는 API 호출 직전에 keyword로 변환한다. 카테고리와 소재는 고정 프론트 enum이 아니라 조회 API의 값으로 관리한다.

상품 상태는 DRAFT, ON_SALE, SOLD_OUT, HIDDEN이다. 정렬 값은 POPULAR, NEWEST, WISHLIST_COUNT, SALES_COUNT, PRICE_ASC, PRICE_DESC다.

### 구매자 상호작용

- 찜: POST 또는 DELETE /api/products/{productId}/wish
- 리뷰 작성: POST /api/products/{productId}/reviews
- 문의 작성: POST /api/products/{productId}/questions
- 문의 답변: POST /api/products/questions/{questionId}/answer, ARTISAN 권한

리뷰와 문의 목록도 cursor pagination으로 처리한다.

### 판매자 관리

- POST /api/products: 상품 등록
- GET /api/products/me: 내 상품 목록
- PATCH /api/products/{productId}: 기본 정보·옵션 수정
- PATCH /api/products/{productId}/status: 판매 상태 변경
- DELETE /api/products/{productId}: 상품 삭제

등록 직후 상품은 DRAFT다. 승인된 상세 콘텐츠를 게시하면 ON_SALE이 되어 공개 조회 대상이 된다.

## AI 상세 콘텐츠 도메인

콘텐츠 상태는 DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED다.

```text
상품 등록(DRAFT)
  → 인터뷰 입력·저장
  → AI 생성 요청
  → 생성 상태 조회
  → 상세 콘텐츠 편집
  → 승인 또는 반려
  → 게시
  → ON_SALE, 공개 목록·상세 노출
```

주요 API는 인터뷰 조회·저장·수정, 생성 요청·상태 조회, 콘텐츠 목록·편집·승인·반려·버전 조회, 게시다. 생성 요청에는 이미지 목록, 상품명, 제작 방식, 관리법이 포함된다. 승인 요청에는 사실 확인과 사진 일치 확인이 포함된다.

## 장인·구매·회원 도메인

- 공개 장인: GET /api/member/artisans, GET /api/member/artisans/{artisanId}
- 장인 관리: GET 또는 PATCH /api/member/artisans/me, POST /api/member/artisans/applications
- 장바구니: /api/payments/cart, /api/payments/cart/items, /api/payments/cart/merge
- 결제: /api/payments, /api/payments/confirm, /api/payments/fail, /api/payments/{paymentId}/cancel
- 회원: 인증, 배송지, 주문, 리뷰, 찜, 최근 본 상품, 설정 API

결제 완료는 결제 SDK의 클라이언트 결과만으로 확정하지 않는다. 결제 승인 API의 성공 응답을 기준으로 주문 완료와 주문 목록을 갱신한다.

## 확인이 필요한 계약

| 항목             | 확인 내용                                                |
| ---------------- | -------------------------------------------------------- |
| AI 생성 careTips | 필수인지 선택 입력인지 확정                              |
| 콘텐츠 게시      | 게시 대상 선택과 PUBLISHED 전환 규칙, 최종 endpoint 확정 |
| 상품 상태 변경   | status 요청 본문의 필수 여부와 허용 전이                 |
| 장인 신청        | 승인 완료와 공개 장인 노출의 관계                        |
| 결제·주문·회원   | 구현 전 화면별 DTO를 이 문서에 반영                      |
