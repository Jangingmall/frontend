# 장바구니 UI (CA-1)

## 범위와 실행

`/cart`는 비회원도 접근할 수 있다. `NEXT_PUBLIC_API_MOCKING=enabled`에서만 샘플 2개 장인·3개 상품을 표시한다. 실제 API 모드는 준비 중 안내를 표시한다. API/결제 SDK/영구 저장은 이번 변경에 포함하지 않는다.

- 개발 실행: `npm run dev -- --port 3151`
- Storybook: `npx storybook dev -p 6151 --ci --no-open`
- 현재 개발 기준 문서는 `docs/architecture.md`, `docs/conventions.md`, `docs/git-convention.md`이다.
- 승인된 제출 계획과 보라색 원문: [구매 UI 계획](superpowers/plans/2026-09-17-cart-checkout-ui-plan.md), [Figma 원문 JSON](superpowers/plans/2026-09-17-cart-checkout-figma-source.json). 원문 부록은 수정하지 않았다.

## 동작

- 구매 가능 상품만 전체·장인·항목 선택 대상이다. 선택 상품의 `단가 × 수량`을 합산한다. 샘플 배송비는 0원이며 별도 배송 정책은 만들지 않는다.
- 수량은 1부터 각 샘플 `maxQuantity`까지 제한한다. 품절은 선택·옵션·수량 변경이 불가하나 삭제는 가능하다.
- 단건·선택 삭제는 확인 후 실행하며 가장 최근 삭제 1회의 항목과 인덱스를 저장한다. 복구는 남아 있는 상품의 최신 변경을 보존하면서 원래 순서를 복원한다.
- 옵션은 필수 최대 3개와 존재하는 선물 옵션만 표시한다. 선물의 ‘선택 안 함’도 완료값이다. 선행 선택이 유효하지 않으면 후속 값을 지우고 다음 선택을 연다. 미완성 초안은 취소 시 버린다. 완성된 조합의 재선택은 유효할 때만 즉시 적용한다.
- 옵션 누락 제출은 빨간 테두리와 하단 토스트를 표시하고 첫 누락 필드에 포커스를 둔다. Dialog/Select의 포털·키보드·스크롤 동작을 재사용한다.
- 비회원 구매는 로그인 안내 후 `/login?returnUrl=%2Fcart`로 이동한다. 로그인 복귀 후 구매 버튼을 다시 누르는 계약이다.
- 장인 이름은 후속 상세 화면이 없어 준비 중 Toast를 표시한다.

## 결제 후속 PR 의존성

로그인한 사용자가 구매하면 `usePurchasePreviewStore.beginCheckout`이 선택된 구매 가능 항목의 깊은 복사본을 메모리에 저장하고 `/checkout/ui-preview-order`로 이동한다. **이 카트 PR에는 checkout route가 없다.** CO-1 후속 PR과 함께 통합해야 실제 화면 이동이 완성된다. 저장소의 typedRoutes 검사에는 예정된 고정 경로를 `Route`로 명시했다. 개인 입력이나 결제정보는 URL/스토리지에 넣지 않는다.

공통 구매 부품·store·ProductOrder 확장은 route에 의존하지 않는 선행 커밋으로 분리되어 checkout/complete 브랜치에서 재사용한다. 소비자 화면에 시나리오 선택 컨트롤을 추가하지 않았다.

## Storybook과 검증

`Pages/Cart`: Default, MixedSoldOut, SoldOut, Empty, Login, Delete, UndoToast.
`Pages/Cart/Options`: Default, Selecting, Selected, Warning, WithoutGift.
기본·품절·빈 화면·옵션 기본/선택 중/완료/경고·삭제 확인/복구 토스트·비회원 안내를 각각 재현한다.

선택·수량 금액·품절 제외·삭제 복구·로그인 분기·옵션 순서·유효한 즉시 적용·누락 포커스·Escape 복귀를 단위/컴포넌트 테스트로 검증한다. 공통 store는 복사본 격리와 초기화를 검증한다.

1440px 브라우저에서 기본/옵션/전체삭제 후 빈 화면을 캡처했다. GNB·Footer와 기존 mock identity switcher는 현재 저장소의 공통 shell이다. 375×400에서 모달 높이 352px, 본문 높이 162px/scrollHeight 222px로 내부 스크롤과 하단 버튼 유지도 확인했다.

![장바구니 기본](screenshots/cart-default.png)
![옵션 모달](screenshots/cart-options.png)
![전체 삭제 후 빈 상태와 복구](screenshots/cart-empty.png)
