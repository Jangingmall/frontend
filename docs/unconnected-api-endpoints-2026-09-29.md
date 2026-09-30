# 프론트 미연결 API 목록 (2026-09-29)

기준: 프론트 PR #114 `7ac6132`, [API 요약](https://jangingmall.github.io/backend/summary.html), 백엔드 develop `1ca01fa6139b45a0bd3245c366ae7e7adb7f2012`. 아래는 이번 소비자 기능 점검 범위이며 서비스 전체 API의 미사용 목록은 아니다. 명세에 없는 경로는 추정해서 적지 않는다.

## 엔드포인트는 있지만 일부 또는 전체 기능을 연결하지 않은 항목

| 항목                      | 실제 엔드포인트                                                                 | 미연결 범위                                         | 이유 / 연결된 부분                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 장바구니 선택형 옵션 변경 | `PATCH /api/payments/cart/items/{cartItemId}/options`                           | 옵션 그룹에서 다른 선택지를 고르는 기능             | 변경 요청은 지원하지만 선택 가능한 그룹·선택지 목록을 가져오는 계약을 확인하지 못했다. 기존 `optionGroupId/choiceId`를 유지하며 **수량·기존 텍스트 입력 변경은 연결**했다.                                                          |
| 결제된 주문 취소          | `POST /api/payments/{paymentId}/cancel`                                         | 결제 후 취소                                        | 필수 경로 값 `paymentId`가 `GET /api/member/me/orders` 및 `GET /api/member/me/orders/{orderId}` 응답에 없다. 주문 ID를 paymentId로 대체하지 않는다. **미결제 취소**인 `POST /api/payments/orders/{orderId}/cancel`은 연결되어 있다. |
| 가상계좌 / 무통장입금     | `POST /api/payments/orders`, `POST /api/payments`, `POST /api/payments/confirm` | `VIRTUAL_ACCOUNT` 결제수단 선택·발급·입금 대기 화면 | 결제수단 명세는 있지만 현재 승인 처리에서 발급과 입금 완료를 구분하지 않고 결제 완료로 처리한다. 발급 계좌와 입금 대기 상태를 표시할 계약도 부족하다. 이 경로의 카드·계좌이체·토스페이는 별도 기존 연결이다.                        |
| 상품 문의 목록 조회       | `GET /api/products/{productId}/questions`                                       | 목록·답변 조회 전체                                 | 비밀 질문 본문과 달리 답변 직렬화에 권한 분기가 없어 다른 사용자의 비밀 답변이 응답에 포함될 수 있다. 화면 마스킹으로 해결되지 않아 GET 요청 자체를 차단한다. 실제 비밀 데이터를 조회해 재현하지 않았다.                            |
| 상품 비밀 문의 작성       | `POST /api/products/{productId}/questions`                                      | `secret: true` 등록                                 | 비밀 답변 보호 문제로 비밀 문의 선택을 비활성화했다. **공개 문의**인 `{content, secret:false}` POST는 연결했다.                                                                                                                     |
| 네이버 로그인 / 가입      | `GET /api/member/oauth2/naver` → `POST /api/member/oauth2/exchange`             | 네이버 진입 및 인증 완료                            | 리다이렉트는 있으나 `OAuthIdentity`가 `kakao`만 허용한다. 네이버 로그인·가입 버튼은 비활성화 상태다.                                                                                                                                |
| 판매량·찜 정렬            | `GET /api/products?sort=...`                                                    | `SALES`, `WISHLIST` 선택                            | 현재 서버 목록 계약에 해당 정렬을 확인하지 못했다. **POPULAR·NEWEST·PRICE_ASC·PRICE_DESC는 연결**했다. POPULAR는 서버 순서를 그대로 사용한다.                                                                                       |
| 소재·공예·선물 포장 필터  | `GET /api/products`; 참고: `GET /api/products/materials`                        | 소재·공예·포장 조건으로 상품 필터링                 | 상품 목록 명세에 해당 필터 파라미터가 없다. 소재 목록 API의 존재가 소재별 상품 검색을 지원한다는 뜻은 아니다.                                                                                                                       |
| 사진 후기 필터            | `GET /api/products/{productId}/reviews`                                         | 사진이 있는 후기만 조회                             | 현재 후기 API에 대응 필터 계약을 확인하지 못했다. 일반 후기 목록 조회는 연결되어 있다.                                                                                                                                              |

## 대응 엔드포인트 계약을 확인하지 못한 항목

| 항목                  | 엔드포인트                                                                                 | 미연결 범위와 이유                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 취소 사진 첨부        | 취소용 대응 API 없음. 참고: `POST /api/images/presigned-url`, `POST /api/payments/returns` | 이미지 업로드·반품/교환 API와 결제 취소 API는 다른 계약이다. 업로드된 사진을 결제 취소 요청과 묶는 계약이 없어 미연결.      |
| 홈 베스트·기획전      | 전용 선정·기획전 계약 미확인. 일반 상품 조회는 `GET /api/products`                         | 기존 목업 섹션의 선정 기준과 구성에 대응하는 계약이 없어 비활성화. 인기 정렬을 연결했다고 홈 기획전을 자동 복구하지 않는다. |
| 재입고 알림 신청      | 대응 API 미확인                                                                            | 상품별 재입고 구독 신청·해지 계약을 확인하지 못했다. 일반 `/api/notifications`를 재입고 신청 API로 대체하지 않는다.         |
| 할인코드 적용 주문    | 대응 적용·검증 API/주문 필드 미확인                                                        | 실제 할인 검증 및 결제금액 계산 계약이 없어 비활성화.                                                                       |
| 쿠폰 적용 주문        | 대응 적용·검증 API/주문 필드 미확인                                                        | 쿠폰 적용 및 서버 계산 계약이 없어 비활성화.                                                                                |
| 적립금 적용 주문      | 대응 사용 API/주문 필드 미확인                                                             | 사용 가능액·차감·서버 계산 계약이 없어 비활성화.                                                                            |
| `preview=1` 상품 상세 | API 항목 아님                                                                              | 목업 시연 라우트이므로 실제 API 모드에서 차단.                                                                              |

## 미연결과 별개인 결제 설정 문제

토스 결제 준비 요청과 SDK 호출은 연결되어 있다. 이전 스테이징 실검증에서 토스 결제창 서버가 `401 UNAUTHORIZED_KEY`를 반환했다. 결제 준비 응답의 테스트 클라이언트 키 설정을 확인해야 하며, 실제 승인·환불 성공으로 보고하지 않는다.

## 확인 자료

- [PR #114](https://github.com/Jangingmall/frontend/pull/114)
- [스테이징 실검증 기록](./staging-api-verification-2026-09-29.md)
- 프론트: `src/api/cart/api.ts`, `src/api/inquiries/api.ts`, `src/api/products/query.ts`
- 백엔드: `member/application/OAuthIdentity.java`, `member/infrastructure/MemberReadRepositoryImpl.java`, `payment/application/PaymentService.java` 및 기존 문의 응답 검토 기록
