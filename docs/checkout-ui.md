# 주문 결제 CO-1 UI

화면 이슈 #59, 브랜치 `feat/checkout-ui`. Figma 현재 기본 `2169:61310`, 입력 `2169:61537`, 결제수단 `2169:61762`와 메모·경고·실패 프레임을 대조했다.

## 검토 진입

`NEXT_PUBLIC_API_MOCKING=enabled`에서 기존 목업 로그인 `user@midam.test` / `midam1234` 후 `/checkout/ui-preview-order`로 진입한다. `/checkout/fail?orderId=ui-preview-order&reason=timeout`은 같은 화면 위 타임아웃 상태이며 `declined`, `cancelled`도 제공한다. 예약 ID 이외 또는 실제 API 모드에서는 샘플 주문이나 성공 상태를 보여주지 않는다. 기존 보호 레이아웃은 변경하지 않았다.

Storybook `Pages/Checkout`에는 기본, 입력 중/완료, 배송메모 선택/직접입력 3단계, 약관 경고, 결제수단 경고, 은행 선택, 카드 거절, 타임아웃, 취소 13개 상태가 있다. `outcome` control로 제출 후 결과를 선택한다. 소비자 화면에는 시나리오 선택기가 없다.

## 연결 계약

- 공용 `PurchaseStepIndicator`, `OrderSummary`, `ArtisanOrderGroup`, `ProductOrder`와 기존 InputField/Select/Checkbox/Radio/Button/Dialog/Toast를 사용한다.
- `usePurchasePreviewStore.beginCheckout` snapshot이 있으면 행·수량·가격을 그대로 표시한다.
  상세의 바로 구매와 장바구니의 선택 구매가 이 snapshot을 채운다
  ([cart-checkout-ui.md](cart-checkout-ui.md) 참고).
  snapshot 없이 직접 검토 URL로 진입한 경우에만 두 행 × 120,000원 fixture를 표시한다.
  주문완료 화면의 무통장입금 합계도 같은 snapshot을 사용한다. 행 개수와 수량은 별도로 표시한다.
- 유효한 폼·약관·수단 제출 시 메모리 snapshot을 기록하고 `/checkout/ui-preview-order/complete?result=success` 또는 `result=bank-pending`으로 이동한다(완료 route·취소 모달의 장바구니 이동 모두 구현됨).
- 폼은 React Hook Form + Zod의 화면 로컬 상태이며 개인정보를 URL 또는 localStorage에 저장하지 않는다. PG SDK/API/재고/가격 재검증·계좌 발급은 이번 범위에 없다. 실제 주문 소유권 검증은 후속 API 통합 책임이다.
- 이름, 전체 이메일, 숫자로 된 전화 각 칸, 수령인, 우편번호와 기본주소를 검사한다. 전화 접두 목록·길이 등 미확정 서버 정책은 추가하지 않았다. 오류 필드에 메시지와 포커스를 제공한다.
- 주문자 동일 체크는 이름·전화 값을 복사하고 체크된 동안 원본 변경을 계속 동기화한다. 수령인 칸은 읽기 전용이며 해제하면 별도 편집한 값을 보존한다. 주소검색은 샘플 주소를 채우고 상세주소로 포커스를 이동한다.

## 댓글과 보라색 설명

공통 원문/해석 계획서는 CA-1 PR의 `docs/superpowers/plans/2026-09-17-cart-checkout-ui-plan.md`를 참조한다.

- #68: 단일 전체 이메일 입력. 예전 분리형 이메일은 구현하지 않았다.
- #70: 기본 010을 직접 수정하는 3분할 입력. 기존 개발 완료일 때 셀렉트 유지가 가능하다는 후속 의견은 미구현 CO-1에 적용하지 않는 계획상의 판단이다.
- #72: 무통장입금에만 안내 4줄. 주말·공휴일을 포함하는 문장을 추가하고 다른 수단에는 안내를 표시하지 않는다. 토스 PNG는 Figma 원본 `2169:61512` export이며 84×16px로 렌더한다.
- 약관 미동의 CTA는 disabled를 우선하고 프로그램 제출 가드와 독립 warning story를 함께 둔다.
- 할인/적립금/쿠폰은 비활성 시각 슬롯이다. 약관 자세히는 공용 Dialog와 준비 안내만 표시하며 전문을 창작하지 않는다. 장인 링크는 준비 안내를 제공한다.
- 실패 원문과 두 취소 액션을 유지한다. 다시 시도/결제 계속하기는 모달만 닫아 현재 폼과 수단을 보존한다.

## 화면 검토

데스크톱 1440px에서 본문 888px, 546/24/318 두 열, 제목 위 64px, 본문 하단 200px를 적용했다. 좁은 화면은 한 열이며 전화 grid의 min-width를 제한해 입력 겹침을 방지한다. 공통 GNB의 모바일 재설계는 이 작업 범위 밖이다.

- `docs/screenshots/checkout-default.png`: 1440px 기본
- `docs/screenshots/checkout-bank.png`: 1440px 유효 입력과 무통장 선택
- `docs/screenshots/checkout-timeout.png`: 1440px 타임아웃 viewport
- `docs/screenshots/checkout-narrow.png`: 390px 한 열

스크린샷은 실제 Playwright 브라우저에서 촬영했고 개발 도구·공통 목업 리모컨은 촬영 CSS로만 숨겼다. 제품 UI 코드는 변경하지 않았다.

## 검증

`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` 및 `PLAYWRIGHT_BASE_URL=http://localhost:3152 npm run test:e2e -- src/e2e/checkout.spec.ts --workers=1`을 사용한다. 필수 입력 복구, 주문자 복사, 직접 메모, 샘플 주소, 제출 약관/수단 가드, 성공/은행 결과 계약, 실패 후 값 보존, 실제 모드·알 수 없는 ID 차단을 검증한다.
