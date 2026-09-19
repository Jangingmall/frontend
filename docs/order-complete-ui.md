# 주문 완료 화면

## 범위

`/checkout/[orderId]/complete`는 결제 뒤 결과를 확인하기 위한 보호 경로다. 현재 구현은 UI 검토용 목업만 제공하며 주문 생성, 결제 승인, 가상계좌 발급, 서버 저장을 수행하지 않는다.

화면은 두 상태를 제공한다.

| `result`       | 화면                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| `success`      | 주문번호와 제작 시작 안내를 표시하는 일반 완료                            |
| `bank-pending` | 입금 전 상태임을 알리고 고정 가상계좌 fixture와 주문 합계를 표시하는 완료 |

`result`를 생략하면 직접 디자인 검토를 위한 일반 완료 fixture를 표시한다.

## 진입과 목업 guard

완료 UI는 다음 조건을 모두 만족할 때만 표시한다.

- `NEXT_PUBLIC_API_MOCKING=enabled`
- Vercel production이 아님
- `orderId`가 `PURCHASE_PREVIEW_ORDER_ID`인 `ui-preview-order`
- `result`가 생략되었거나 `success` 또는 `bank-pending`

검토 URL은 다음과 같다.

```text
/checkout/ui-preview-order/complete?result=success
/checkout/ui-preview-order/complete?result=bank-pending
```

실제 API 모드, Vercel production, 다른 주문 ID, 배열 또는 알 수 없는 결과, `declined`, `timeout`, `cancelled`에서는 완료 UI 대신 404 안내를 표시한다. 실패나 취소가 결제 완료처럼 보이는 경로는 허용하지 않는다.

보호 경로의 인증 처리는 상위 `(protected)/layout.tsx`가 유지한다. URL에는 개인정보를 넣지 않으며 완료 상태를 영구 저장하지 않는다.

## 데이터와 동작

- 주문번호, 가상계좌, 예금주, 입금기한, direct URL 기본 합계는 `order-complete-fixture.ts`의 검토 fixture다.
- 무통장입금 금액은 `usePurchasePreviewStore.checkoutLines`가 있으면 `unitPrice × quantity` 합계를 사용한다. 직접 URL 검토처럼 snapshot이 없으면 fixture 합계를 사용한다.
- `주문 내역 보기`는 아직 `/mypage/orders`가 없으므로 공용 `Toast`로 준비 중 안내를 표시한다.
- `계속 둘러보기`는 홈(`/`)으로 이동한다.

## 레이아웃

Figma 기준은 일반 완료 node `1906:50709`, 무통장입금 대기 node `1976:148958`이다.

- 1440px desktop에서 본문 최대 너비 888px
- GNB 다음 제목까지 64px
- 제목 행 다음 완료 내용까지 128px
- 현재 구매 단계 `03 주문 완료`
- 액션 영역 최대 너비 424px, 버튼 간격 8px
- 가상계좌 카드 최대 너비 520px, 높이 약 128px
- 일반 완료 액션 이후 Footer까지 234px
- 무통장 완료 액션 이후 Footer까지 200px
- Figma의 보라색 spacing annotation은 실제 화면에 렌더하지 않음

별도 모바일 Figma는 없다. 좁은 폭에서는 제목과 구매 단계가 세로로 배치되고 breadcrumb는 잘리지 않도록 가로 overflow를 허용한다. 본문, 카드, 버튼 영역은 사용 가능한 너비에 맞춰 줄어든다.

## 검증

- 컴포넌트/상태/route 테스트: 두 화면, 버튼 callback, Toast, 홈 이동, fixed ID/result guard
- Storybook: `Checkout/OrderCompletePage`의 `Success`, `BankPending`
- Playwright: mock 로그인 후 두 완료 화면, Toast와 홈 이동, cancelled/unknown ID 차단
- 1440px 실제 캡처:
  - [일반 완료](screenshots/order-complete-success.png)
  - [무통장입금 대기](screenshots/order-complete-bank-pending.png)

저장소 완료 기준인 `format:check`, `validate:env`, `typecheck`, `lint`, `test`, `build`, `build-storybook`을 통과했다.

## 의존성

새 패키지나 API 의존성을 추가하지 않았다. 기존 구매 foundation의 `PurchaseStepIndicator`, `Button`, `Toast`, `usePurchasePreviewStore`, `PreviewPaymentOutcome`, `PURCHASE_PREVIEW_ORDER_ID`를 사용한다.
