# API / MSW 모드 구현 계획

> 실행: 승인 설계에 따라 현재 세션에서 직접 구현한다. test-driven-development 및 executing-plans를 적용한다.

**Goal:** 현재 화면 전체에서 MSW 전용과 API+미구현 MSW 모드를 제공한다.
**Architecture:** 기능별 소스 목록과 같은 화면 모델을 공유하며 서버/브라우저에 동일한 MSW 선택 정책을 적용한다. 실제 오류는 목업으로 바꾸지 않는다.
**Spec:** ../specs/2026-09-28-api-msw-modes-design.md

## 제약

기존 화면 유지, 신규 관리자/판매자 화면 제외, 실제 상태와 시연 상태 분리, npm 사용. 내부용 API는 브라우저에 노출하지 않는다.

## 검증 집중 항목

API 모드의 실요청 가로채기, 실제 오류 은폐, 목업 토큰의 백엔드 전송, SSR/브라우저 모드 불일치, 구매 금액/주문 혼합을 회귀 테스트한다.

## 작업

1. [x] 모드 설정과 기능별 소스 판정
   - `src/lib/data-mode.ts`, `src/lib/env.ts`, `src/mocks/{handlers,browser,server,start-browser}.ts`, `src/instrumentation.ts` 변경.
   - 설정 충돌·순수 API 통과·미구현 요청 격리 테스트를 먼저 작성/실패 확인 후 구현.
2. [x] 기존 API 연결 보완
   - `src/api/products/`, `src/api/orders/`, `src/api/reviews/`, `src/api/inquiries/`, `src/api/member/` 및 해당 query/UI 경로.
   - 소재 string[]/subcategoryId, 반품 객체, 미지원 필터·문의·재입고·네이버 격리 테스트 후 구현.
3. [x] 전체 MSW 시연 경로와 UI 통일
   - 장바구니·체크아웃의 로컬 동작을 MSW 요청으로 연결하고 미지원 구매 흐름을 격리.
   - 동일 화면/실제 요청/계정 전환 테스트 후 구현.
4. [x] 전체 연결 목록 및 최종 검증
   - 설계 API별 현재 화면, 실제 경로, 소스, 미연결 사유를 문서화.
   - typecheck, lint, test, build, MSW/API 모드 브라우저 검증.
   - PR 템플릿에 구현 범위 및 실서버 미검증 사항 기록.

## 진행 기록

- 승인: 사용자가 설계 및 기존 규칙에 따른 브랜치·이슈·PR 생성을 요청했다.
- 선행 PR93 병합 확인. dev@a722454에서 feat/api-msw-modes 생성. 이슈 #96.
- Ruling: 사용자가 설계대로 진행을 명시했으므로 실행 방법은 현재 세션 직접 구현으로 유지하고 추가 승인 단계 없이 진행한다.

- 구현 검증: typecheck/lint 통과, 195 파일 1,151 테스트 통과. MSW Playwright 36 통과·실서버 계정 필요 1 스킵. API 모드 제어된 계약 서버 검증 통과.
- API 모드 브라우저 재현으로 Node 전역 인터셉터가 Next rewrite를 정체시키는 문제를 발견했다. SSR fetch 경계의 MSW getResponse resolver로 분리해 실제 요청 전달과 시연 경로 격리를 확인했다.
- 코드 리뷰에서 확인한 분류/소재 코드 불일치, 데모 hydration, 계정별 비밀문의, 만료 플래그, 장바구니 덮어쓰기, 할인 시연 미연결을 수정했다.
- 실서버 OAuth·메일·PG 승인 및 현재 없는 화면은 연결 완료로 세지 않는다. 시연 카탈로그의 분류/소재 범위는 docs/api-msw-modes.md에 명시했다.
- 사용자 승인된 통합 방식: feat/api-msw-modes를 push하고 기존 PR #97을 갱신한다. dev 직접 병합은 이 작업에서 수행하지 않는다.
