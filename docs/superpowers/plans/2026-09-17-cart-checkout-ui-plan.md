# 장바구니·주문·결제 화면 구현 계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **문서 상태:** 사용자 검토용 계획안. 이번 작업에서는 화면 코드를 작성하지 않았다. Figma 파일과 댓글도 수정하지 않았다.

**Goal:** 기존 디자인 시스템을 최대한 재사용하여 장바구니(CA-1), 주문 결제(CO-1), 주문 완료(OC-1)의 디자인과 화면 내 상태를 구현한다.

**Architecture:** Next.js App Router의 기존 GNB·Footer·로그인 보호 레이아웃을 유지하고, 화면은 route 내부 `_components`에서 조합한다. 데이터는 이번 단계에서 로컬 샘플을 사용하며, 결제 SDK나 실제 주문 API 없이 화면 전환·선택·입력·모달·토스트를 재현한다. 장바구니에서 결제까지 이어지는 임시 화면 상태만 작은 메모리 store로 공유한다.

**Tech Stack:** 저장소 `dev`의 Next.js 16.3.4, React 19, TypeScript, Tailwind CSS, Base UI 기반 기존 컴포넌트, Zustand, React Hook Form, Zod, Storybook, Vitest, Playwright. npm만 사용한다.

**Spec:** 이 문서의 화면 목록·댓글 반영 기준·원문 부록과 [Figma 대상 페이지](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=889-59175). 추출 원본은 [JSON 근거 자료](./2026-09-17-cart-checkout-figma-source.json).

**확인 기준:** 2026-09-17, GitHub `dev` 커밋 `7d73a1f676ab96af8b688c4c1d688bb7d98803b6`. 현재 로컬 작업 브랜치의 미커밋 판매자/AI 상세페이지 변경은 구현 기준에 포함하지 않는다.

## 1. 이번 범위

### 포함

- 장바구니 기본·품절·빈 상태, 전체/장인별/상품별 선택, 수량 및 합계 표시.
- 옵션 변경의 기본·선택 중·선택 완료·미선택 경고.
- 단건/선택 삭제 확인, 삭제 토스트와 되돌리기, 비로그인 안내.
- 주문 고객·배송 정보·배송메모·주문 작품·할인/부가결제 슬롯·결제수단·약관·결제 요약.
- 약관 미체크와 결제수단 미선택 안내, 카드 거절·타임아웃·취소/이탈 모달.
- 일반 주문 완료와 무통장입금 주문 완료.
- 모든 상태를 확인할 수 있는 Storybook 사례와 목업 환경의 페이지 진입.
- 기존 GNB에서 장바구니 진입, 목업 장바구니→결제→완료 흐름.
- 보라색 상자는 기획 설명이다. 텍스트/규칙을 반영하되 보라색 박스·번호·화살표 자체는 서비스 화면에 그리지 않는다.

### 이번에 연결하지 않는 항목

실제 장바구니 저장/병합 API, 서버 주문 생성, 재고·가격 최종 검증, 토스페이먼츠 호출/승인/취소, 가상계좌 발급·입금 확인, 실제 할인코드·쿠폰·적립금, 외부 주소검색 서비스, 마이페이지와 장인 상세 신규 개발은 후속이다. 이 경계는 사용자의 “일단 화면만” 요청을 따른다.

화면 테스트에서 주문 완료가 보여도 실제 주문 또는 결제 성공을 뜻하지 않는다. 샘플 상태·샘플 주문번호는 `NEXT_PUBLIC_API_MOCKING=enabled`인 검토 환경에서만 사용하며, 실제 모드에서 데모 성공을 만들지 않는다.

### 구현 방식 선택

| 방식                                             | 판단                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| **기존 컴포넌트 + 로컬 상태 + Storybook (채택)** | 디자인 재사용률을 높이고 모든 모달·입력·오류 상태를 검토할 수 있다.     |
| 정적인 화면 복제만 생성                          | 화면 수는 채우지만 선택·토스트·입력 전환 검수가 어려워 채택하지 않는다. |
| 실제 주문·결제 API까지 구현                      | 이번 요청 범위를 넘으므로 후속으로 분리한다.                            |

## 2. 확인한 화면 24개와 반영 방식

한 상태마다 페이지를 복제하지 않는다. 실제 route 3종에서 컴포넌트 상태로 표현한다. 기존 계약의 실패 route는 같은 결제 화면의 실패 상태 진입점으로 둔다.

| 구분  | Figma node  | 화면/상태             | 계획                                                                    |
| ----- | ----------- | --------------------- | ----------------------------------------------------------------------- |
| CA-01 | 1906:46966  | 장바구니 기본         | 장인별 그룹, 선택, 수량, 옵션, 결제 요약                                |
| CA-02 | 1906:48200  | 상품 카드 품절        | 체크·옵션·수량·구매 비활성, 품절 dim/배지, 삭제 허용                    |
| CA-03 | 1906:48278  | 장바구니 빈 상태      | 안내와 홈 이동                                                          |
| CA-04 | 1906:48009  | 옵션 변경 기본        | 중앙 모달, 내부 스크롤, 필수 옵션 최대 3개 + 조건부 선물 옵션           |
| CA-05 | 1994:45726  | 옵션 선택 중          | 순서별 선택·다음 드롭다운 열기                                          |
| CA-06 | 1994:46094  | 옵션 재선택/선택 완료 | 이전 선택과 바뀐 선택 표시, 완료 상태 변경 규칙 적용                    |
| CA-07 | 1994:46397  | 옵션 미선택 경고      | 빨간 테두리·오류 토스트                                                 |
| CA-08 | 1994:46684  | 상품 삭제 확인        | 취소/삭제하기                                                           |
| CA-09 | 1906:48295  | 상품 삭제 토스트      | “장바구니에 다시 추가” 복구                                             |
| CA-10 | 1994:47176  | 비로그인 모달         | 로그인 이동/취소/배경 닫기                                              |
| CO-01 | 2169:61310  | 결제 기본             | 현재 기본 프레임을 기준으로 조합                                        |
| CO-02 | 2169:61537  | 주문 고객 입력 중     | 입력 focus·값·clear·휴대전화 상태                                       |
| CO-03 | 2169:61762  | 결제수단 선택         | 4개 수단, 무통장입금 안내                                               |
| CO-04 | 1906:50973  | 배송메모 선택         | 선택 목록                                                               |
| CO-05 | 1906:51189  | 배송메모 직접입력     | 직접입력 필드                                                           |
| CO-06 | 1906:51408  | 입력 변형 2           | 배송 입력 상태를 유지하고, 이전 이메일 분리형은 #68 기준으로 수정       |
| CO-07 | 1906:51627  | 입력 변형 3           | 입력 완료 상태를 유지하고, 이전 이메일 분리형은 #68 기준으로 수정       |
| CO-08 | 1906:51845  | 약관 미체크 토스트    | 원본 경고 상태를 Storybook에 보존, 실행 규칙은 아래 충돌 해소 기준 적용 |
| CO-09 | 1906:52058  | 결제수단 미선택       | “결제수단을 선택해 주세요.”                                             |
| CO-10 | 1976:146279 | 카드 거절/한도초과    | 실패 안내·다시 시도                                                     |
| CO-11 | 1976:146982 | 타임아웃              | 실제 문구 기준으로 구분. 레이어명은 카드 거절로 중복돼 있음             |
| CO-12 | 1976:147432 | 사용자 취소·이탈      | 실제 문구 기준으로 구분. 레이어명은 카드 거절로 중복돼 있음             |
| OC-01 | 1906:50709  | 일반 주문 완료        | 주문번호·안내·버튼 2개                                                  |
| OC-02 | 1976:148958 | 무통장입금 주문 완료  | 가상계좌 정보·결제금액·입금 기간 추가                                   |

원본 Figma 링크 형식: `https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=위-node의-콜론을-하이픈으로-변경`. 부록에서는 각 원문에 클릭 가능한 링크를 제공한다.

## 3. 댓글을 반영한 수정 기준

현재 페이지 필터와 “Show resolved comments”를 함께 사용해 **4개 스레드, 원댓글과 답글 총 14개**를 확인했다. #71은 해결된 댓글이며 #68·#70·#72는 미해결 목록에 있었다. 미해결 표시와 대화 내용의 합의 여부는 별개다.

| 댓글      | 설명/이전 화면                                      | 계획에 반영할 내용                                                                         | 판단 근거                                                                                                                                 |
| --------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| #68       | 이메일을 아이디/도메인으로 나누고 직접입력으로 전환 | **전체 이메일을 한 번에 입력하는 단일 InputField**. 이전 도메인 선택 UI는 새 구현에서 제외 | 화면 변경 제안에 “문제 없습니다” 답변. 현재 CO-1 기본 프레임도 전체 이메일 입력                                                           |
| #70       | 앞자리 010/011/016/017/직접입력 셀렉트              | **3분할 배치 유지, 앞자리 기본값 010을 직접 수정 가능**한 입력으로 계획                    | 입력창 전환 합의 뒤 “이미 개발 되었으면 선택지 유지”라는 조건부 후속 의견. CO-1 미구현이므로 그 조건이 적용되지 않는다는 이번 계획의 해석 |
| #71 → #72 | 입금 안내 3줄                                       | “입금 기한은 주말 및 공휴일을 포함하여 계산됩니다.” 추가                                   | #72의 문장형 문구를 채택                                                                                                                  |
| #72 답글  | 결제수단별 유의사항 여부                            | 무통장입금에만 안내 표시. 계좌이체·카드·토스페이는 안내 없음                               | 정책 담당자의 명시적 답변                                                                                                                 |

**#70은 확정 사실과 계획상 판단을 구분한다.** 기존 화면의 셀렉트를 반드시 유지해야 한다는 무조건적 지시로 읽지 않는다. 추후 사용자가 셀렉트 유지로 정하면 `PhoneFields`의 앞자리 입력만 교체하며 주문/배송 양쪽에 동일 적용한다. 나머지 작업을 막는 항목은 아니다.

**무통장입금 화면에 사용할 문구:**

> OO은행 000-0000-0000 (예금주: OOO)  
> 주문 완료 후 24시간 이내 입금해 주세요.  
> 입금 기한은 주말 및 공휴일을 포함하여 계산됩니다.  
> 입금 기한 내 미입금 시 주문이 자동 취소됩니다.

은행·계좌·예금주는 샘플 값이다. 실제 정책 집행이나 계좌 발급을 이번 화면 구현에서 수행하지 않는다.

## 4. 디자인과 설명이 충돌하는 부분의 처리

| 항목                     | 발견한 차이                                                         | 이번 계획                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 약관 CTA                 | 설명에는 미동의 시 비활성, 별도 프레임에는 미체크 토스트            | 기본 화면은 비활성 규칙을 우선. 토스트 모양은 별도 Storybook 상태로 전부 구현하고 제출 검증 함수도 동의 누락을 처리. 클릭 불가능 버튼에 억지 클릭 동작을 붙이지 않음                                       |
| 옵션 저장 시점           | 기본 설명은 “변경하기”로 저장, 완료 상태 설명은 변경 즉시 적용·닫힘 | 미완성→선택 중은 초안으로 유지해 “변경하기”로 확정. 이미 모든 선택이 완료된 상태에서 값을 다시 선택하면, 유효한 완성 조합일 때만 즉시 반영·닫힘. 선행 변경으로 다음 옵션이 무효화되면 완료로 취급하지 않음 |
| 전체 선택과 품절         | 기본 설명은 전체 상품 선택, 품절 설명은 선택 불가                   | 구매 가능한 항목만 선택 대상. 품절도 X 버튼으로 삭제 가능                                                                                                                                                  |
| 선택 N/4                 | 그림은 필수 3개+선물 1개 예시, 설명은 필수 최대 3개·선물 조건부     | 예시는 4로 재현하되 실제 표시 분모는 노출 옵션 수. 없는 선물 옵션을 만들어내지 않음                                                                                                                        |
| 숫자·가격 예시           | 기본 그림에는 선택 체크와 0원 요약이 함께 있음                      | 시각 구조를 따르되 화면 상태의 금액은 선택한 샘플 항목의 합계와 일치시킴                                                                                                                                   |
| 숨겨진 템플릿 잔재       | 옵션 모달 안에 숨겨진 비밀번호·비밀번호 확인 레이어가 존재          | 보이는 옵션 모달과 기획 설명에 맞춰 제외                                                                                                                                                                   |
| 이메일 관련 이전 프레임  | 보라색 설명은 분리형, #68과 현재 기본 프레임은 단일 입력            | #68 우선. 원문은 삭제하지 않고 부록에 보존                                                                                                                                                                 |
| 완료 페이지의 짧은 frame | 원본 923px frame 밖으로 Footer가 이어지는 경우                      | 화면 높이를 923px에 강제로 자르지 않고 자연스러운 문서 흐름과 하단 여백 유지                                                                                                                               |
| 주소검색·약관 자세히     | 버튼은 있으나 이 페이지에는 대응 화면/전문 없음                     | 주소는 샘플 선택 동작으로 입력 외형 확인. 약관은 공용 Dialog 외형과 제공된 짧은 안내만 표시. 약관 전문을 임의 작성하지 않음                                                                                |
| 장인 상세·주문내역 이동  | 현재 목적지 route 미구현                                            | 버튼·링크 외형 보존, 콜백 계약 분리. 미구현 route로 404 이동시키지 않고 현재 저장소의 준비 중 안내 패턴 적용. 해당 페이지 구현 후 연결                                                                     |

## 5. 기존 디자인 시스템 재사용표

`dev` 소스의 실제 props와 Figma 참조 화면을 대조했다. 현재 로컬 루트는 이전 개발 브랜치이므로 후속 구현은 최신 `dev`에서 별도 브랜치/작업 공간으로 시작한다.

| 기존 요소                                       | 위치                                             | 사용 계획                                       | 필요한 보완                                                                           |
| ----------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| SiteGnb·Gnb·Footer                              | `src/app/site-gnb.tsx`, `src/components/common/` | 전 화면 공통 shell 그대로 사용                  | 검토 모드 장바구니 개수만 SiteGnb에서 전달                                            |
| Breadcrumb / BreadcrumbItem                     | `src/components/ui/breadcrumb.tsx`               | 01/02/03 스텝 구성, href 없이 현재 단계 강조    | 구매 공용 wrapper만 추가                                                              |
| Button                                          | `src/components/ui/button.tsx`                   | solid/jade/outline/ghost 및 기존 사이즈         | 원본 54px/56px 차이는 size l/xl로 구분                                                |
| Checkbox                                        | `src/components/ui/checkbox.tsx`                 | 전체/그룹/항목 선택, 약관, 주문자와 동일        | 기존 disabled·indeterminate 지원 활용                                                 |
| Stepper                                         | `src/components/ui/stepper.tsx`                  | 수량 증감, 품절 disabled                        | 해당 행에서 min/max만 제공                                                            |
| InputField                                      | `src/components/ui/input-field.tsx`              | 이름·이메일·전화·주소·직접입력                  | 36px 화면은 기존 className/inputClassName으로 한정 조정                               |
| Select                                          | `src/components/ui/select.tsx`                   | 옵션·배송메모·할인 슬롯                         | 기존 포털/키보드 처리 유지                                                            |
| Dialog                                          | `src/components/ui/dialog.tsx`                   | 옵션 모달 form, 확인·실패·비로그인 confirmation | 원본 560px/480px 폭과 footer 조합 재사용                                              |
| Toast                                           | `src/components/ui/toast.tsx`                    | 삭제 복구, 옵션 오류, 약관·결제수단 경고        | 위치·노출 상태는 화면이 소유                                                          |
| ProductOrder                                    | `src/components/product/ProductOrder.tsx`        | 이미지·이름·옵션·가격·유의사항                  | 현 inline 배치와 Figma의 가격 아래 배치가 달라, 선택적 stacked variant/액션 슬롯 보완 |
| PaymentsMethod                                  | `src/components/order/PaymentsMethod.tsx`        | 결제수단 4개와 무통장입금 안내                  | #72 문구 1줄 추가, 토스페이 로고 자산 반영                                            |
| OrderProductCard·OrderInfoBar·OrderExpandToggle | `src/components/order/`                          | 후속 주문내역에서 재사용 가능                   | 이번 결제 화면과 구조가 다른 주문상태 UI를 억지로 끼우지 않음                         |
| Icons·Badge                                     | `src/components/ui/icons/`, `badge.tsx`          | 삭제·화살표·품절                                | 기존 SVG 우선, 토스페이 로고는 Figma 원본 자산 사용                                   |
| 디자인 토큰                                     | `src/app/globals.css`                            | 타이포·색·dim·품절·그림자                       | 전역 토큰 값을 이번 화면 때문에 바꾸지 않음                                           |

재사용 기준은 “기존 요소를 사용하면서 해당 Figma 배치가 맞는가”이다. 동일 기능의 Button·Checkbox·Select·Dialog를 새로 만들지 않는다. `ProductOrder` 기본 모습은 그대로 두고 **선택적 props**로 새 표현만 추가하여 기존 Storybook/소비자를 보존한다.

### 재사용 컴포넌트 확장 방향

```ts
// 기존 ProductOrderProps에 추가할 선택적 표현 인터페이스.
// 기본값 inline은 기존 모습 유지.
variant?: "inline" | "stacked";
actions?: ReactNode;          // 옵션 변경 등
quantityControl?: ReactNode;  // 없으면 기존 수량 텍스트
thumbnailOverlay?: ReactNode; // 품절 dim·배지
```

장바구니 선택/삭제 제어는 `CartProductCard`가 소유하고, 상품 표시 부품은 `ProductOrder`를 사용한다. 전역 Checkbox나 Stepper에 장바구니 API/상태를 넣지 않는다.

## 6. 레이아웃 기준

- 데스크톱 기준 너비 1440px. 본문 888px, 좌우 여백 276px.
- 2열 화면은 본문 546px + 간격 24px + 우측 요약 318px.
- GNB 122px 아래 제목까지 64px. 제목은 기존 `text-title-xl`(26px/600), 섹션 제목은 `text-title-m`(17px/600).
- CA-1 제목 y=186, 선택 바 y=244, 상품/요약 시작 y=288.
- CO-1 제목 y=186, 주문 고객 섹션 y=268, 우측 요약 y=304. 본문 하단 이후 200px 여백.
- 옵션 모달은 Figma와 기존 form Dialog의 560px 폭, 확인/실패 모달은 480px 폭을 사용한다. 높이는 뷰포트 안에 제한하고 내용 영역을 스크롤한다.
- 모달 dim은 기존 `bg-bg-deam`(검정 75%). 품절은 `bg-states-sold-out`, 오류는 `border-red-border`.
- 주문 완료 제목 아래 여백 128px, 일반 완료 하단 234px, 무통장 완료 하단 200px. 기타 여백은 부록 원문 표와 대조한다.
- 주문 완료 가상계좌 박스는 520px, 버튼 묶음 424px를 기준으로 한다.
- 이번 페이지에는 별도 모바일 디자인이 없으므로 데스크톱 정합성이 우선이다. 좁은 폭에서는 본문을 1열로 배치하고 입력·모달이 잘리지 않게 한다. 공통 GNB 모바일 재설계는 별도 작업이다.
- 샘플 썸네일은 원본의 placeholder 표현 또는 기존 저장소 자산을 사용한다. Figma에 없는 사진을 새로 생성하지 않는다.

## 7. 라우트·파일 배치와 데이터 경계

기존 `docs/routing-and-auth.md`의 계약을 따른다. 임의의 `/orders/complete`나 `/checkout` 경로를 추가로 설계하지 않는다.

| URL                            | 파일                                                       | 역할                                                                  |
| ------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `/cart`                        | `src/app/cart/page.tsx`                                    | 비회원도 볼 수 있는 장바구니                                          |
| `/checkout/[orderId]`          | `src/app/(protected)/checkout/[orderId]/page.tsx`          | 로그인 보호 + 결제 UI                                                 |
| `/checkout/fail`               | `src/app/(protected)/checkout/fail/page.tsx`               | 기존 실패 경로. 별도 디자인을 만들지 않고 같은 결제 UI 실패 상태 사용 |
| `/checkout/[orderId]/complete` | `src/app/(protected)/checkout/[orderId]/complete/page.tsx` | 일반/무통장 완료 UI                                                   |

`page.tsx`는 화면 진입과 조합만 담당하고 `params`/`searchParams`는 설치된 Next.js 문서대로 Promise를 await한다. 개인 입력값이나 결제 정보를 URL에 넣지 않는다.

### 신규 파일의 책임

```text
src/types/purchase-preview.ts
src/stores/purchase-preview.ts
src/stores/purchase-preview.test.ts
src/components/order/PurchaseStepIndicator.tsx
src/components/order/OrderSummary.tsx
src/components/order/ArtisanOrderGroup.tsx

src/app/cart/
  page.tsx
  _components/CartPage.tsx
  _components/CartProductCard.tsx
  _components/CartOptionDialog.tsx
  _components/CartDeleteDialog.tsx
  _components/CartLoginDialog.tsx
  _lib/cart-selection.ts
  _lib/cart-selection.test.ts
  _lib/cart-fixtures.ts

src/app/(protected)/checkout/
  _components/CheckoutPage.tsx
  _components/CustomerFields.tsx
  _components/PhoneFields.tsx
  _components/ShippingFields.tsx
  _components/DeliveryMemoField.tsx
  _components/CheckoutProducts.tsx
  _components/DiscountSlots.tsx
  _components/PaymentAgreement.tsx
  _components/PaymentFeedbackDialog.tsx
  _components/OrderCompletePage.tsx
  _lib/checkout-fixtures.ts
  _lib/checkout-form-schema.ts
  _lib/checkout-form-schema.test.ts
  [orderId]/page.tsx
  [orderId]/complete/page.tsx
  fail/page.tsx

src/e2e/cart-checkout.spec.ts
docs/cart-checkout-ui.md
```

Storybook과 필요한 컴포넌트 테스트는 해당 컴포넌트 옆에 `.stories.tsx`/`.test.tsx`로 둔다. 공용 order 부품에는 cart/checkout route를 import하지 않는다. API 응답 모델이나 실제 서버 상태를 preview store에 넣지 않는다.

### UI 상태 인터페이스

```ts
type PreviewPaymentMethod =
  "REALTIME_TRANSFER" | "BANK_TRANSFER" | "CARD" | "TOSS_PAY";

type PreviewPaymentOutcome =
  "success" | "bank-pending" | "declined" | "timeout" | "cancelled";

interface CartPreviewLine {
  lineId: string;
  productId: number;
  artisanId: number;
  artisanName: string;
  productName: string;
  thumbnail: ImageRef; // 기존 src/types/image 타입 사용
  options: string[];
  quantity: number;
  unitPrice: number;
  maxQuantity: number;
  soldOut: boolean;
  selected: boolean;
  note?: string;
}

interface PurchasePreviewState {
  lines: CartPreviewLine[];
  checkoutLines: CartPreviewLine[];
  setLines: (lines: CartPreviewLine[]) => void;
  beginCheckout: (selectedLines: CartPreviewLine[]) => void;
  resetPreview: () => void;
}
```

- 샘플 주문 ID는 `ui-preview-order` 한 가지를 예약한다. 실제 주문번호와 혼동하지 않는다.
- 장바구니 선택·수량·옵션 수정은 메모리에서만 반영한다. localStorage/서버 영구 저장은 없다.
- `beginCheckout`은 선택된 구매 가능 항목의 복사본을 보관한다. CO-1에서 수량·금액을 그 복사본으로 표시한다.
- 비회원 “구매하기”는 기존 로그인 화면으로 `returnUrl=/cart`를 전달하고, 로그인 복귀 후 구매 버튼으로 진행한다.
- 직접 결제 URL로 접근하는 목업 검토는 고정 fixture로도 재현한다. 실제 모드에서 fixture를 반환하지 않는다.
- 결제 결과 선택 컨트롤은 Storybook controls에 둔다. 소비자 화면에 개발용 시나리오 선택기를 추가하지 않는다.
- `complete`의 실제 본인 주문 확인은 BE 연동 때 적용할 계약으로 남긴다. 현재 보호 레이아웃을 서버 소유권 검증이 완성된 것으로 간주하지 않는다.

## 8. 작업 순서

### Task 1. 최신 개발 기준과 구매 공용 배치

**Files:** 위 신규 공용 3개 컴포넌트, `src/types/purchase-preview.ts`, cart/checkout 진입 파일.  
**Consumes:** 기존 GNB·Footer·Breadcrumb·Button·디자인 토큰.  
**Produces:** `PurchaseStepIndicator({ current: 1 | 2 | 3 })`, `OrderSummary({ productAmount, shippingAmount, totalAmount, totalLabel, children })`, `ArtisanOrderGroup({ artisanName, children, headerAction, onArtisanClick })`.

- [ ] 최신 원격 dev를 다시 확인하고 별도 작업 공간에서 시작한다. 현재 로컬 AI 상세페이지 작업은 건드리지 않는다.
- [ ] 각 route에 서버 page와 화면 조합 컴포넌트를 배치한다. 보호 route는 기존 `(protected)` 아래 둔다.
- [ ] 스텝을 href 없는 BreadcrumbItem 3개로 만들고 현재 항목에 강조와 aria-current를 적용한다.
- [ ] 888px/546px/318px 공통 배치와 요약 박스·장인 그룹 껍데기를 기존 토큰으로 구성한다.
- [ ] Storybook에서 3개 스텝과 cart/checkout 요약 라벨의 차이를 확인한다.
- [ ] 커밋 단위: `feat: 구매 화면 공통 레이아웃 구성`.

### Task 2. 상품 표시 재사용과 장바구니 기본·품절·빈 상태

**Files:** `ProductOrder.tsx` 및 관련 story/test, `CartPage.tsx`, `CartProductCard.tsx`, `cart-fixtures.ts`, `cart-selection.ts`, preview store, `site-gnb.tsx`.  
**Consumes:** Task 1 공용 배치, 기존 ProductOrder·Checkbox·Stepper·Badge·Toast.  
**Produces:** 전체/그룹/항목 선택 상태와 정확한 금액 요약, `getPurchasableLines(lines)`, `getSelectedAmount(lines)`.

- [ ] 샘플 2개 장인/3개 항목, 혼합 품절, 전부 품절, 빈 배열 fixture를 정의한다.
- [ ] 기존 ProductOrder의 기본 동작을 보존한 채 stacked 표현과 필요한 슬롯을 추가한다.
- [ ] 전체 선택과 장인 선택이 구매 가능 항목에만 작용하도록 구현한다.
- [ ] 수량 1~각 샘플 maxQuantity 내에서 Stepper를 제어하고 합계를 즉시 계산한다.
- [ ] 품절은 dim/배지·선택/옵션/수량 비활성, X 삭제는 유지한다.
- [ ] 0개 선택 시 CTA 비활성, 선택 수 N과 총 금액 갱신, 빈 화면 홈 이동을 연결한다.
- [ ] 검토 모드에서만 GNB 개수와 preview 항목 수를 연결한다.
- [ ] 의미 있는 회귀 검증: 품절 혼합 전체선택, 그룹 선택, 수량 변화 후 금액, 마지막 항목 삭제 후 빈 화면.
- [ ] 커밋 단위: `feat: 장바구니 기본 화면과 선택 상태 구현`.

핵심 계산의 계약:

```ts
getSelectedAmount(lines) ===
  lines
    .filter((line) => line.selected && !line.soldOut)
    .reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
```

샘플 배송비는 fixture 값만 표시하며 무료배송 기준이나 묶음배송 정책을 임의로 추가하지 않는다.

### Task 3. 장바구니 옵션·삭제·로그인 모달

**Files:** `CartOptionDialog.tsx`, `CartDeleteDialog.tsx`, `CartLoginDialog.tsx`, 관련 story/test.  
**Consumes:** Task 2 항목 갱신, 기존 Dialog·Select·Toast·Button.  
**Produces:** 옵션 적용, 삭제/복구, 로그인 안내.

- [ ] 옵션은 최대 필수 3개와 존재하는 선물 옵션으로 표시한다. 선물 “선택 안 함”도 완료 선택값으로 다룬다.
- [ ] 선택값 bold, 선택 후 닫힘, 다음 옵션 자동 열림, 미선택 이전 단계에 따른 비활성을 구현한다.
- [ ] 미완성 초안은 취소 시 원래 값 유지. 완성 상태 변경은 4절 규칙에 따라 적용한다.
- [ ] 미선택 제출 시 첫 누락 필드로 focus 이동, 빨간 테두리와 원문 토스트를 표시한다.
- [ ] 삭제 확인에서 취소/실행을 구분하고 단건/선택 삭제를 같은 Dialog로 처리한다.
- [ ] 삭제된 항목과 원래 순서를 한 번의 undo snapshot으로 보관해 “장바구니에 다시 추가”로 복구한다. 복구 전에도 CTA와 합계가 일치해야 한다.
- [ ] 비로그인 모달은 PD-1과 같은 문구·480px confirmation을 사용하고 returnUrl을 기존 safeReturnUrl 계약에 맞춘다.
- [ ] Esc·배경 닫기·Tab focus trap·trigger focus 복귀와 짧은 뷰포트의 내부 스크롤을 확인한다.
- [ ] 커밋 단위: `feat: 장바구니 옵션 변경과 삭제 복구 구현`.

### Task 4. 주문 고객·배송 입력 및 주문 작품

**Files:** `CheckoutPage.tsx`, `CustomerFields.tsx`, `PhoneFields.tsx`, `ShippingFields.tsx`, `DeliveryMemoField.tsx`, `CheckoutProducts.tsx`, `DiscountSlots.tsx`, checkout fixture/schema.  
**Consumes:** 선택 상품 snapshot, ProductOrder stacked, 기존 InputField·Select·Checkbox.  
**Produces:** 입력 중/완료/배송메모 상태의 CO-1 본문.

- [ ] 현재 기본 프레임 2169:61310 기준으로 섹션 순서와 간격을 배치한다.
- [ ] #68에 따라 이메일은 단일 type=email 입력으로 구성한다.
- [ ] #70 계획 기준으로 전화는 앞자리 기본 010 입력 + 중간/끝 숫자 입력의 3분할로 구성한다. 주문자·배송지에 같은 PhoneFields를 사용한다.
- [ ] “주문자 정보와 동일” 선택 시 수령인 이름·전화를 복사하고, 체크 해제 후 별도 편집을 허용한다.
- [ ] 주소검색 버튼은 샘플 주소 선택 콜백으로 우편번호·기본주소를 채운다. 상세주소는 직접 입력한다.
- [ ] 배송메모 목록과 직접입력/작성 중/완료 상태를 구현한다.
- [ ] 필수값은 이름·전체 이메일·전화·수령인·주소를 검사하고, 실패 시 해당 필드 오류와 focus를 표시한다. 번호 정책은 서버 계약으로 확정하지 않는다.
- [ ] 주문 작품은 장인별 그룹과 기존 ProductOrder로 표시한다. N은 주문 행 개수, 각 행의 수량은 별도 표시한다.
- [ ] 할인코드·적립금·쿠폰은 시각 슬롯만 제공하고 실제 금액에 영향을 주지 않는다.
- [ ] 입력 상태 테스트: 이메일 단일 필드, 주문자 복사, 직접 배송메모, 입력 실패/복구.
- [ ] 커밋 단위: `feat: 주문 결제 입력 화면 구성`.

### Task 5. 결제수단·약관·실패 상태

**Files:** `PaymentsMethod.tsx` 및 관련 story/test, `PaymentAgreement.tsx`, `PaymentFeedbackDialog.tsx`, `checkout/fail/page.tsx`.  
**Consumes:** CO-1 폼, 기존 Radio·Dialog·Toast, 결제 요약.  
**Produces:** 결제수단 선택·동의·실패 모달 시각 상태.

- [ ] 기존 PaymentsMethod를 사용하고 #72의 4줄 안내로 보완한다.
- [ ] Figma 토스페이 로고를 기존 자산과 대조하고, 없으면 원본을 프로젝트 자산으로 확보한다. 로고를 임의 SVG로 그리지 않는다.
- [ ] 약관 체크/자세히/CTA 상태를 구현한다. 미동의 기본 상태는 disabled로 두고 별도 경고 story도 유지한다.
- [ ] 결제수단 미선택 토스트를 원문 그대로 표시한다.
- [ ] 카드 거절·타임아웃은 원문 제목/설명과 “다시 시도”를 표시한다. 닫으면 입력과 결제수단을 유지한다.
- [ ] 취소·이탈은 “장바구니로 돌아가기”와 “결제 계속하기”로 구분한다. 브라우저 종료를 강제로 잡는 복잡한 정책은 이번 범위에서 도입하지 않는다.
- [ ] 목업 성공/무통장 대기/실패 시나리오는 UI adapter의 결과값으로 전달하고 외부 네트워크를 호출하지 않는다.
- [ ] 기존 PaymentsMethod 4개 수단 사례를 회귀 확인한다.
- [ ] 커밋 단위: `feat: 결제 수단과 결과 안내 상태 구현`.

### Task 6. 주문 완료 2종과 화면 연결

**Files:** `OrderCompletePage.tsx`, `[orderId]/complete/page.tsx`, 관련 story/test.  
**Consumes:** preview 주문 snapshot, `PreviewPaymentMethod`, `PreviewPaymentOutcome`, 공용 스텝.  
**Produces:** 일반 완료·무통장입금 완료, cart→checkout→complete 목업 이동.

- [ ] 일반 완료의 제목·주문번호·제작 안내·버튼과 64/128/234px 여백을 맞춘다.
- [ ] 무통장 완료의 입금 안내·520px 가상계좌 박스·금액·기간과 64/128/200px 여백을 맞춘다.
- [ ] 가상계좌 값과 기간은 고정된 검토 fixture로 전달하고 실제 발급처럼 처리하지 않는다.
- [ ] “계속 둘러보기”는 홈, “주문 내역 보기”는 미래 `/mypage/orders` 콜백으로 분리하고 현재는 준비 중 안내를 사용한다.
- [ ] 보라색 spacer 자체는 렌더하지 않고 같은 높이의 실제 여백만 적용한다.
- [ ] 실패/취소 상태가 일반 주문 완료 화면으로 잘못 이동하지 않는지 확인한다.
- [ ] 커밋 단위: `feat: 주문 완료 화면 2종 구현`.

### Task 7. 화면 상태 커버리지와 시각 검수

**Files:** 각 story/test, `src/e2e/cart-checkout.spec.ts`, `docs/cart-checkout-ui.md`.  
**Consumes:** Tasks 1–6의 화면 전체.  
**Produces:** 24개 참조 상태의 검수표와 실행 방법.

- [ ] 2절의 24개 행마다 대응 story 또는 페이지 상태를 연결한다. 댓글로 대체한 이메일 상태는 “대체됨”과 근거 #68을 표시한다.
- [ ] 보라색 설명 17개, 여백 15개, 빈 상태 이동 표기, 댓글 4개가 어디에 반영됐는지 문서에 체크한다.
- [ ] 1440px에서 원본과 나란히 비교한다. 888px 본문·모달 폭·타이포·버튼 크기·스크롤 영역을 검수한다.
- [ ] 360px와 높이가 짧은 데스크톱에서 입력과 모달 잘림을 점검한다. 공통 GNB의 기존 모바일 제약은 별도 기록한다.
- [ ] E2E: 장바구니 선택/옵션/삭제복구 → 목업 로그인 → 결제 입력 → 수단/동의 → 일반/무통장 완료.
- [ ] E2E: 품절 전용·빈 장바구니, 결제 미선택, 거절·타임아웃·이탈, 재시도 후 입력 유지.
- [ ] 커밋 단위: `test: 장바구니 주문 결제 화면 흐름 검증`.

## 9. 검증 명령과 완료 기준

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run build-storybook
npm run test:e2e
npm run format:check
```

후속 구현 완료 시 최소 typecheck/lint/test를 통과하고, 신규 route 영향이 있으므로 build도 실행한다. Storybook·E2E는 목업 상태에서 검증한다. 문서 작성만 한 현재 단계에서는 앱 테스트를 새로 실행하지 않는다.

**완료로 판단하는 조건:**

1. 24개 Figma 참조 상태에 대해 구현 또는 댓글에 따른 대체가 추적된다.
2. 보라색 원문은 아래 부록에 모두 있고, 실제 구현 규칙과 달라진 항목은 3·4절에서 이유를 찾을 수 있다.
3. 기존 디자인 시스템 부품을 재사용하고 기존 화면 기본 스타일이 변하지 않는다.
4. 단순 클릭뿐 아니라 선택·합계·복구·focus·동의·결제 실패 상태가 일치한다.
5. 검토 환경에서 실제 주문·결제·계좌 발급 API를 호출하지 않는다.
6. 서비스 화면에 Figma 기획 번호·보라색 박스·개발용 상태 선택기를 노출하지 않는다.
7. 운영 API 연동·실제 결제 완료로 과장하지 않고 UI 단계의 검증 결과를 보고한다.

## 10. 후속 API 연결을 위한 분리 지점

- CartPage의 항목 조회·갱신 콜백 → 실제 cart Query/mutation.
- `beginCheckout` → 주문 생성과 서버 orderId.
- CheckoutPage의 로컬 제출 adapter → 서버 검증·토스 결제 요청.
- PaymentFeedbackDialog → 실제 오류코드와 안전한 사용자 문구 매핑.
- OrderCompletePage의 props → 서버 승인/입금대기 상태, 본인 주문 확인.
- 주소검색·이용약관 전문·장인 상세·주문내역 콜백 → 각 확정 서비스/route.

이번 단계에서 잠정 백엔드 endpoint, 임의 결제 상태 enum 계약 또는 서버 DTO를 새로 만들지 않는다.

---

## 부록 A. 보라색 상자 텍스트 전체 원문

대상 페이지에서 읽은 **기획 설명 17개, 여백 설명 15개, 이동 안내 1개, 설명 번호 33개**를 아래에 수록했다. 보라색 설명 상자 안의 드롭다운 예시 문구도 중복을 제거하지 않고 모두 포함했다. 상태 범례는 보라색 항목과 함께 놓인 다른 두 색상 설명까지 기록했다.

원문의 오타·명칭 불일치·공백·문장·줄바꿈을 보존했다. 예를 들어 장바구니 설명의 `PD-1`, 이메일 설명 상자의 “배송메모” 제목도 원문 그대로다. 원문과 댓글이 충돌하면 **본문 3·4절의 반영 기준**을 적용한다. 보라색 상자는 구현 설명이므로 화면에 그대로 노출하는 UI 문구와 구분한다.

### A-1. 장바구니·결제 기획 설명 17개

#### A-1. 장바구니 (CA-1) - 기본 1번-7번

[설명 상자 1908:55589](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55589)

텍스트 노드 `1908:55591`

```text
 스텝 인디케이터
구성: 01 장바구니 > 02 주문 결제 > 03 주문 완료
현재 단계 강조 표시 (01 장바구니)
클릭 이동 불가 (표시 전용)

전체 선택
클릭 시 → 장바구니 내 전체 상품 선택
재클릭 시 → 전체 선택 해제

선택 삭제
선택된 상품이 1개 이상일 때 활성
클릭 시 → 삭제 확인 모달 노출
확인 클릭 시 → 선택된 상품 전체 삭제
참고: [장바구니 (CA-1) - 상품 삭제 확인 모달]

장인 체크박스
클릭 시 → 해당 장인의 상품 전체 선택
재클릭 시 → 해당 장인의 상품 전체 해제
장인 이름 클릭 시 → 장인 상세페이지로 이동

상품 체크박스
클릭 시 → 해당 상품 선택
재클릭 시 → 해당 상품 선택 해제

옵션 변경 클릭 시 → [장바구니 (CA-1) - 옵션 변경 모달 (기본)] 오픈

N건 구매하기 CTA
클릭 시 → [결제 (CO-1) - 기본] 이동
비로그인 시 → 비로그인 모달 노출 참고: [장바구니 (CA-1) - 비로그인 모달]
선택된 상품이 0개일 때 비활성 참고: [장바구니 (CA-1) - 상품 카드 (품절)]
```

#### A-2. 장바구니 (CA-1) - 상품 카드 (품절)

[설명 상자 1908:55974](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55974)

텍스트 노드 `1908:55975`

```text
전체 선택
선택 가능한 상품이 없을 때 → opacity 60% 비활성

장인 체크박스 + 장인 이름
장인 체크박스 클릭 불가
장인 이름 클릭 시 → 장인 상세페이지로 이동

상품 체크박스
클릭 불가 비활성

상품 이미지 (품절 시)
품절 딤 처리: Semantic/states/sold-out 적용
품절 배지 노출

X 버튼
클릭 시 → 삭제 확인 모달 노출
확인 클릭 시 → 상품 삭제
참고: [장바구니 (CA-1) - 상품 삭제 확인 모달]

옵션 변경
버튼 disabled 상태 (클릭 불가)

수량 스테퍼
버튼 disabled 상태 (클릭 불가)

구매하기 CTA
구매 가능한 상품이 없을 시 비활성
버튼 disabled 상태 (클릭 불가)
```

#### A-3. 장바구니 (CA-1) - 비로그인 모달

[설명 상자 1908:55963](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55963)

텍스트 노드 `1908:55964`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
 모달 위치: 화면 중앙

닫기
‘취소’ 버튼 클릭 시 → 모달 닫힘
배경 딤 클릭 시 → 모달 닫힘

로그인하기 버튼
클릭 시 → [로그인 (LI-1)] 이동

[상품 상세페이지 (PD-1) - 비로그인 모달]과 동일
```

#### A-4. 상품 상세페이지 (PD-1) - 옵션 선택 완료

[설명 상자 1908:56050](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56050)

텍스트 노드 `1908:56051`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

선택 완료 상태에서 하나라도 변경 시 → 변경된 상태 그대로 즉시 적용 후 모달 닫힘
```

텍스트 노드 `1951:142109`

```text
→ hover
```

텍스트 노드 `1951:142110`

```text
옵션 선택 완료
```

텍스트 노드 `1951:142111`

```text
옵션 선택 중
```

텍스트 노드 `1951:142112`

```text
옵션 재선택 완료
```

텍스트 노드 `I1951:142113;489:3291;300:1018`

```text
선택된 필수 옵션 1
```

텍스트 노드 `I1951:142114;489:3291;300:1018`

```text
재선택된 필수 옵션 1
```

텍스트 노드 `I1951:142115;489:3301;489:3060`

```text
필수 옵션 1 (수정)
```

텍스트 노드 `I1951:142115;489:3310;489:3116`

```text
항목을 선택해주세요
```

텍스트 노드 `I1951:142115;489:3315;489:3116`

```text
항목을 선택해주세요
```

텍스트 노드 `I1951:142115;489:3320;489:3116`

```text
항목을 선택해주세요
```

텍스트 노드 `I1951:142115;489:3325;489:3116`

```text
항목을 선택해주세요
```

#### A-5. 장바구니 (CA-1) - 옵션 변경 모달 (선택 중)

[설명 상자 1908:56052](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56052)

텍스트 노드 `1908:56053`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

드롭다운 — 선택 완료 상태
선택된 값이 드롭다운에 표시 → 글씨 볼드
드롭다운 닫힘

드롭다운 — 열림 상태
항목 클릭 시 → 즉시 ‘1.  선택 완료 상태’로 전환 + 드롭다운 닫힘
선택 완료 즉시 → 다음 순서 드롭다운 자동으로 열림

’선택 (N/4)’ → 선택 완료 시마다 N 1씩 증가

선택 순서
1번 옵션 선택 완료 → 2번 드롭다운 자동 열림
2번 옵션 선택 완료 → 3번 드롭다운 자동 열림
순서대로 진행되며 이전 옵션 미선택 시 다음 옵션 비활성
```

텍스트 노드 `1908:56055`

```text
→ hover
```

텍스트 노드 `1908:56056`

```text
기본 상태
```

텍스트 노드 `1908:56057`

```text
옵션 선택 중
```

텍스트 노드 `1908:56058`

```text
옵션 선택 완료
```

텍스트 노드 `I1908:56059;489:3291;300:1018`

```text
필수 옵션 1
```

텍스트 노드 `I1908:56060;489:3291;300:1018`

```text
선택된 필수 옵션 1
```

텍스트 노드 `I1908:56061;489:3301;489:3060`

```text
필수 옵션 2
```

텍스트 노드 `I1908:56061;489:3310;489:3116`

```text
항목을 선택해주세요
```

텍스트 노드 `I1908:56061;489:3315;489:3116`

```text
항목을 선택해주세요
```

텍스트 노드 `I1908:56061;489:3320;489:3116`

```text
항목을 선택해주세요
```

텍스트 노드 `I1908:56061;489:3325;489:3116`

```text
항목을 선택해주세요
```

#### A-6. 장바구니 (CA-1) - 옵션 변경 모달 (기본)

[설명 상자 1908:99067](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-99067)

텍스트 노드 `1908:99068`

```text
뷰포트 높이 초과 시 → 우측 영역 내부 스크롤바 노출
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

옵션 구성
필수 옵션 최대 3개 드롭다운으로 표시
선물 옵션은 데이터 존재 시에만 노출 (없으면 미노출)

취소 버튼
클릭 시 → 모달 닫힘

변경하기 버튼
옵션 선택 완료 시 → 즉시 수정 반영 후 모달 닫힘
옵션 미선택 시 → [장바구니 (CA-1) - 옵션 변경 모달 (미선택 경고)]
```

#### A-7. 장바구니 (CA-1) - 상품 삭제 확인 모달

[설명 상자 1951:142159](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1951-142159)

텍스트 노드 `1951:142160`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

취소 버튼
클릭 시 → 모달 닫힘

삭제하기 버튼
클릭 시 → 선택된 상품 삭제
삭제 후 → 상품 삭제 토스트 노출
참고: [장바구니 (CA-1) - 상품 삭제 토스트]
```

#### A-8. 장바구니 (CA-1) - 상품 삭제 토스트

[설명 상자 1951:142161](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1951-142161)

텍스트 노드 `1951:142162`

```text
삭제하기 버튼 클릭 후 하단 토스트 노출

‘장바구니에 다시 추가’ 버튼 클릭 시 → 삭제된 상품 복구
```

#### A-9. 상품 상세페이지 (PD-1) - 옵션 미선택 경고

[설명 상자 1908:56062](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56062)

텍스트 노드 `1908:56063`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

트리거
필수 옵션 미선택 상태에서 「변경하기」 버튼 클릭 시

경고 표시
미선택 드롭다운 → ‘red/border’ 처리
총 상품 금액 영역 → 「옵션을 선택하지 않았습니다」 토스트 노출
```

#### A-10. 결제 (CO-1) - 기본

[설명 상자 1951:142451](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1951-142451)

텍스트 노드 `1951:142452`

```text
0. 스텝 인디케이터
구성: 01 장바구니 > 02 주문 결제 > 03 주문 완료
현재 단계 강조 표시 (02 주문 결제)
클릭 이동 불가 (표시 전용)

결제하기 버튼
약관 동의 체크 후 활성
클릭 시 → 재고·가격 최종 검증 후 토스페이먼츠 결제창 호출
결제 성공 시 → [주문 완료 OC-1] 이동
결제 실패 시 → [결제 (CO-1)] - 결제 실패 복귀 
주문 작품 정보 (N건)
N = 총 주문 상품 개수

장인 이름
클릭 시 → [장인 상세 AD-1] 이동

할인/부가결제
할인코드 / 적립금 / 쿠폰 UI 슬롯만 노출
실제 동작하지 않음
```

#### A-11. 결제 (CO-1)- 배송메모 직접 입력

[설명 상자 1972:145130](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1972-145130)

텍스트 노드 `1972:145131`

```text
배송 메모
클릭 시 선택 목록 노출
직접 입력 선택 시 → 참고: 결제 (CO-1) - 주문 고객 입력 중 (배송메모 직접입력)
```

#### A-12. 결제 (CO-1)- 배송메모 직접 입력

[설명 상자 1976:145862](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-145862)

텍스트 노드 `1976:145863`

```text
이메일 직접입력 상태
도메인 셀렉트에서 「직접 입력」 선택 시 → 도메인 입력창으로 즉시 전환
아래 화살표 클릭 시 → 도메인 선택 목록 다시 노출

이메일 직접입력 중
이메일 직접입력 완료
```

#### A-13. 결제 (CO-1) - 카드 거절/한도초과

[설명 상자 1976:148186](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-148186)

텍스트 노드 `1976:148187`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

‘다시 시도' 클릭시 → 모달 닫힘, [결제수단(CO-1)] 유지
```

#### A-14. 결제 (CO-1) - 타임아웃

[설명 상자 1976:148190](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-148190)

텍스트 노드 `1976:148191`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

‘다시 시도' 클릭시 → 모달 닫힘, [결제수단(CO-1)] 유지
```

#### A-15. 결제 (CO-1) - 사용자 취소 · 이탈

[설명 상자 1976:148468](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-148468)

텍스트 노드 `1976:148469`

```text
배경 딤 처리: bg/deam (#000000 / 75%)
모달 위치: 화면 중앙

‘장바구니로 돌아가기' 클릭시 → [장바구니 (CA-1)]으로 이동
‘결제 계속하기' 클릭시 → 모달 닫힘, [결제수단(CO-1)] 유지
```

#### A-16. 결제 (CO-1) - 주문 고객 입력 중

[설명 상자 1972:144820](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1972-144820)

텍스트 노드 `1972:144821`

```text
0. 스텝 인디케이터
구성: 01 장바구니 > 02 주문 결제 > 03 주문 완료
현재 단계 강조 표시 (02 주문 결제)
클릭 이동 불가 (표시 전용) 
휴대전화
3분할 입력: 앞자리 셀렉트 + 중간 4자리 + 끝 4자리
앞자리 기본값: 010
앞자리 선택 목록: 010 / 011 / 016 / 017 / 직접 입력
```

#### A-17. 결제 (CO-1)-결제수단 선택

[설명 상자 1976:147887](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-147887)

텍스트 노드 `1976:147888`

```text
결제 수단별 안내 고지
실시간 계좌이체 선택 시 → 안내 없음
신용·체크카드 선택 시 → 안내 없음
토스페이 선택 시 → 안내 없음
무통장입금 선택 시 → 안내 노출
「OO은행 000-0000-0000 (예금주: OOO)」
「주문 완료 후 24시간 이내 입금해 주세요.」
「입금 기한 내 미입금 시 주문이 자동 취소됩니다.」
```

### A-2. 빈 장바구니의 페이지 이동 안내

[페이지 이동 1908:55969](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55969)

텍스트 노드 `I1908:55969;814:19417`

```text
[홈 HO-1] 으로 이동
```

### A-3. 여백 설명 15개

여백도 보라색 상자 안의 텍스트이므로 모두 수록했다. “대상 페이지”를 부모로 갖는 표시는 페이지 바깥에서 각 화면 옆에 놓인 설명이다. 실제 적용 화면은 본문 6절과 원본 좌표를 함께 확인한다.

| 설명 노드                                                                               | 부모 화면 또는 페이지                                        | 텍스트 노드   | 원문       |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------- | ---------- |
| [2169:61758](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2169-61758)   | 결제 (CO-1) - 주문 고객 입력 중 (`2169:61537`)               | `2169:61759`  | 여백 200px |
| [2169:61988](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2169-61988)   | 결제 (CO-1)-결제수단 선택 (`2169:61762`)                     | `2169:61989`  | 여백 200px |
| [1994:45400](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1994-45400)   | 장바구니 (CA-1) - 빈 상태 (`1906:48278`)                     | `1994:45401`  | 여백 200px |
| [1994:45402](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1994-45402)   | 장바구니 (CA-1) - 빈 상태 (`1906:48278`)                     | `1994:45403`  | 여백 280px |
| [1994:45404](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1994-45404)   | 장바구니 (CA-1) - 빈 상태 (`1906:48278`)                     | `1994:45405`  | 여백 64px  |
| [1976:149161](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-149161) | 주문 완료 화면 (OC-1) - 주문 완료 (기본) (`1906:50709`)      | `1976:149162` | 여백 234px |
| [1976:149163](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-149163) | 주문 완료 화면 (OC-1) - 주문 완료 (기본) (`1906:50709`)      | `1976:149164` | 여백 64px  |
| [1976:149166](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-149166) | 주문 완료 화면 (OC-1) - 주문 완료 (기본) (`1906:50709`)      | `1976:149167` | 여백 128px |
| [1976:149740](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-149740) | 주문 완료 화면 (OC-1) - 무통장입금 주문 완료 (`1976:148958`) | `1976:149741` | 여백 200px |
| [1976:149742](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-149742) | 주문 완료 화면 (OC-1) - 무통장입금 주문 완료 (`1976:148958`) | `1976:149743` | 여백 64px  |
| [1976:149744](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-149744) | 주문 완료 화면 (OC-1) - 무통장입금 주문 완료 (`1976:148958`) | `1976:149745` | 여백 128px |
| [1906:55582](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1906-55582)   | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)         | `1906:55583`  | 여백 200px |
| [1906:55585](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1906-55585)   | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)         | `1906:55586`  | 여백 64px  |
| [2402:155994](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2402-155994) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)         | `2402:155995` | 여백 200px |
| [2402:155996](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2402-155996) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)         | `2402:155997` | 여백 64px  |

### A-4. 보라색 설명 번호 33개

다음 숫자는 화면에 표시할 콘텐츠가 아니라 설명과 화면 위치를 연결하는 Figma 표식이다.

| 표식 노드                                                                               | 부모 화면 또는 페이지                                             | 텍스트 노드              | 원문 |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------ | ---- |
| [2169:61760](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2169-61760)   | 결제 (CO-1) - 주문 고객 입력 중 (`2169:61537`)                    | `I2169:61760;814:19434`  | 2    |
| [2169:61761](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2169-61761)   | 결제 (CO-1) - 주문 고객 입력 중 (`2169:61537`)                    | `I2169:61761;814:19429`  | 1    |
| [2169:61990](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2169-61990)   | 결제 (CO-1)-결제수단 선택 (`2169:61762`)                          | `I2169:61990;814:19429`  | 1    |
| [1908:55592](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55592)   | 장바구니 (CA-1) - 기본 (`1906:46966`)                             | `I1908:55592;814:19429`  | 4    |
| [1908:55688](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55688)   | 장바구니 (CA-1) - 기본 (`1906:46966`)                             | `I1908:55688;814:19429`  | 5    |
| [1908:55653](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55653)   | 장바구니 (CA-1) - 기본 (`1906:46966`)                             | `I1908:55653;814:19425`  | 3    |
| [1908:55680](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55680)   | 장바구니 (CA-1) - 기본 (`1906:46966`)                             | `I1908:55680;814:19425`  | 2    |
| [1951:142444](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1951-142444) | 장바구니 (CA-1) - 기본 (`1906:46966`)                             | `I1951:142444;814:19434` | 1    |
| [1908:55684](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55684)   | 장바구니 (CA-1) - 기본 (`1906:46966`)                             | `I1908:55684;814:19434`  | 7    |
| [1908:55670](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-55670)   | 장바구니 (CA-1) - 기본 (`1906:46966`)                             | `I1908:55670;814:19429`  | 6    |
| [1908:142098](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-142098) | 장바구니 (CA-1) - 옵션 변경 모달 (기본) (`1906:48009`)            | `I1908:142098;814:19425` | 1    |
| [1908:142103](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-142103) | 장바구니 (CA-1) - 옵션 변경 모달 (기본) (`1906:48009`)            | `I1908:142103;814:19425` | 2    |
| [1994:46985](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1994-46985)   | 장바구니 (CA-1) - 상품 삭제 확인 모달 (`1994:46684`)              | `I1994:46985;814:19438`  | 2    |
| [1994:46986](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1994-46986)   | 장바구니 (CA-1) - 상품 삭제 확인 모달 (`1994:46684`)              | `I1994:46986;814:19438`  | 1    |
| [1994:47423](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1994-47423)   | 장바구니 (CA-1) - 비로그인 모달 (`1994:47176`)                    | `I1994:47423;814:19438`  | 2    |
| [1994:47424](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1994-47424)   | 장바구니 (CA-1) - 비로그인 모달 (`1994:47176`)                    | `I1994:47424;814:19438`  | 1    |
| [1908:56015](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56015)   | 장바구니 (CA-1) - 상품 카드 (품절) (`1906:48200`)                 | `I1908:56015;814:19429`  | 2    |
| [1908:56016](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56016)   | 장바구니 (CA-1) - 상품 카드 (품절) (`1906:48200`)                 | `I1908:56016;814:19425`  | 1    |
| [1908:56017](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56017)   | 장바구니 (CA-1) - 상품 카드 (품절) (`1906:48200`)                 | `I1908:56017;814:19429`  | 7    |
| [1908:56018](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56018)   | 장바구니 (CA-1) - 상품 카드 (품절) (`1906:48200`)                 | `I1908:56018;814:19429`  | 3    |
| [1908:56019](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56019)   | 장바구니 (CA-1) - 상품 카드 (품절) (`1906:48200`)                 | `I1908:56019;814:19429`  | 4    |
| [1908:56021](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56021)   | 장바구니 (CA-1) - 상품 카드 (품절) (`1906:48200`)                 | `I1908:56021;814:19429`  | 5    |
| [1908:56044](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1908-56044)   | 장바구니 (CA-1) - 상품 카드 (품절) (`1906:48200`)                 | `I1908:56044;814:19429`  | 6    |
| [1951:142175](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1951-142175) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)              | `I1951:142175;814:19434` | 1    |
| [1976:145842](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-145842) | 결제 (CO-1) - 배송지 메모 선택 (`1906:50973`)                     | `I1976:145842;814:19429` | 1    |
| [1976:145847](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-145847) | 결제 (CO-1)- 주문 고객 입력 중 (배송메모 직접입력) (`1906:51189`) | `I1976:145847;814:19429` | 1    |
| [1976:145852](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-145852) | 결제 (CO-1)- 주문 고객 입력 중 (배송메모 직접입력) (`1906:51408`) | `I1976:145852;814:19429` | 2    |
| [1976:145857](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1976-145857) | 결제 (CO-1)- 주문 고객 입력 중 (배송메모 직접입력) (`1906:51627`) | `I1976:145857;814:19429` | 3    |
| [2402:155989](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2402-155989) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)              | `I2402:155989;814:19434` | 0    |
| [2402:155990](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2402-155990) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)              | `I2402:155990;814:19434` | 1    |
| [2402:155991](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2402-155991) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)              | `I2402:155991;814:19429` | 2    |
| [2402:155992](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2402-155992) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)              | `I2402:155992;814:19429` | 3    |
| [2402:155993](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=2402-155993) | 🛠️ [FE] 소비자페이지_장바구니·주문결제 (`889:59175`)              | `I2402:155993;814:19434` | 4    |

### A-5. 상태 범례

보라색은 `[PD] 더블 체크 필요`를 뜻한다. 같은 범례 안의 모든 텍스트는 다음과 같다.

[네이밍 색상 단계 936:25277](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=936-25277)

텍스트 노드 `I936:25278;104:24`

```text
[FE] 제작 가능 - [PD] 작업 완료
```

텍스트 노드 `I936:25279;104:24`

```text
[FE] 제작 불가능 - [PD] 작업 중
```

텍스트 노드 `I936:25280;104:24`

```text
[PD] 더블 체크 필요
```

## 부록 B. 해당 페이지 댓글 전체 원문과 반영 결과

Figma 댓글 패널에서 “현재 페이지만”과 “해결된 댓글 표시”를 함께 확인했다. **4개 스레드, 답글 포함 14개 메시지**다. 조회일은 2026-09-17이며, 상태는 조회 시점의 Figma 표시다. 아래 내용은 읽기만 했고 댓글 작성·수정·해결 처리는 하지 않았다.

### #68. 이메일 입력 방식 — 미해결

**1. Taekyeong Kim**

```text
@김민교 여쭤보신 이메일 기입 방식 개발에 문제 없다면 현재 이 화면에 표시된 방식으로 변경 및 진행하고자 합니다.
```

**2. 김민교**

```text
문제 없습니다
```

**계획 반영:** 현재 기본 프레임 2169:61310의 전체 이메일 단일 입력을 사용한다. 이전 분리형 도메인 선택/직접입력 설명은 원문 부록에 보존하되 새 UI 기준에서는 대체한다.

### #70. 휴대전화 입력 방식 — 미해결

**1. 윤정운**

```text
기존 011, 016, 107 등의 선택지는 제외합니다.
```

**2. jihyeon**

```text
그러면 010만 두겠다는 건가요?
```

**3. jihyeon**

```text
아니면 모두 입력창으로 변경할까요?
```

**4. 윤정운**

```text
010을 기본값으로 두고 선택은 직접입력만 가능하게 두겠습니다!
```

**5. 윤정운**

```text
네 모두 입력창으로 변경해도 괜찮을 것 같습니다!
```

**6. jihyeon**

```text
어제 이메일 쪽 구현 과정에서 직접 입력과 관련해 디자인상 오류가 발생해서, 기본값은 010으로 두고 선택 시 직접 입력할 수 있는 입력창으로 변경하는 방향으로 하겠습니다. ‘선택’ 방식으로 진행할 경우 더미 데이터가 아닌 실제 번호 체계에 맞춰 011, 016, 017 등을 함께 제공해야 하기 때문에, 기본은 010으로 두고 필요할 경우 직접 입력할 수 있도록 구성하겠습니다.
```

**7. 윤정운**

```text
확인했습니다 감사합니다!
```

**8. jihyeon**

```text
@이주영 @김민교 혹시 개발 되었으면, 입력창 변경 말고, 선택지로 하겠습니다..! 011, 016, 017...으로..
```

**계획 반영:** 조건부 의견이 남은 항목이다. CO-1은 아직 미구현이므로 이번 계획은 3분할 배치를 유지하며 앞자리 기본값 010을 직접 편집할 수 있는 입력으로 채택한다. 마지막 댓글의 '이미 개발 되었으면' 조건에는 해당하지 않는다는 해석이며, 디자이너 확정으로 단정하지 않는다.

### #71. 무통장입금 안내 초안 — 해결됨

**1. 윤정운**

```text
OO은행 000-0000-0000 (예금주: OOO)
주문 완료 후 24시간 이내 입금해 주세요.
※ 주말 및 공휴일 포함
※ 입금 기한 내 미입금 시 주문이 자동 취소됩니다.
```

**계획 반영:** 후속 #72의 문장형 문구로 통일한다. '주말 및 공휴일 포함' 의미는 유지한다.

### #72. 무통장입금 최종 안내 및 다른 결제수단 안내 — 미해결

**1. 윤정운**

```text
OO은행 000-0000-0000 (예금주: OOO)
주문 완료 후 24시간 이내 입금해 주세요.
입금 기한은 주말 및 공휴일을 포함하여 계산됩니다.
입금 기한 내 미입금 시 주문이 자동 취소됩니다.
```

**2. jihyeon**

```text
실시간 계좌 이체 / 무통장 입금 / 신용 체크카드 / 토스페이일시 유의사항이 모두 다를까요?
```

**3. 윤정운**

```text
현재 정의된 결제 정책 기준으로는 무통장입금에만 별도 안내가 필요하여 나머지 결제수단은 유의사항을 노출하지 않는 방향으로 진행하겠습니다!
```

**계획 반영:** PaymentsMethod의 무통장입금 안내에 주말·공휴일 문장을 추가한다. 실시간 계좌이체·카드·토스페이는 안내를 표시하지 않는다.
