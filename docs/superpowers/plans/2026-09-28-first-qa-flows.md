# 1차 QA 소비자 흐름 수정 계획

> 실행: superpowers:executing-plans를 사용해 각 항목을 직접 수정하고 마지막에 전체 변경을 검토한다.

**Goal:** 사용자가 전달한 로그인·검색·찜·구매 확정·교환/환불 QA 5건을 최신 dev에서 검증하고 확정된 결함을 수정한다.
**Architecture:** 기존 API → Query → 화면 구조를 유지한다. 서버 상태를 임의로 덮어쓰지 않고 검색 경로와 캐시 갱신, 폼 조건을 수정한다.
**Tech Stack:** Next.js 16.3.4, React 19, TanStack Query, MSW, Zod, Vitest.
**Spec:** 2026-09-28 사용자 QA 5개 항목(아래 각 작업에 기록).

## 제약 및 검토 포인트

- npm만 사용, fix/first-qa-flows 브랜치, dev 기준.
- 이미 찜한 상품의 서버 상태를 무조건 false로 만들지 않는다. 사용자에게 목업 시드 제거 여부 확인 중.
- 실패한 구매 확정은 화면 상태를 바꾸지 않는다.
- 검색어 한글·공백·특수문자, 결과 있음/없음, 오류를 구분한다.
- 파손 사유에서 다른 사유로 변경하면 사진 필수 표시와 오류도 해제한다.
- 로그인 완료 버튼 위치 확인 전 임의의 다른 버튼을 변경하지 않는다.

## 작업 1: 로그인/찜 검증

- 대상: src/app/login/_components/LoginForm.tsx 및 테스트, src/e2e/login.spec.ts, src/app/products/[productSlug]/_components/ProductPurchasePanel.test.tsx.
- [x] 기존 로그인 홈 이동과 새로고침 세션 유지 검증.
- [x] 비로그인/미등록 상품의 빈 하트, 기존 찜의 선택 상태 검증.
- [x] QA 화면과 현재 코드 차이 및 사용자 확인 결과에 따라 필요한 변경만 수행.

## 작업 2: 검색 연결

- 대상: src/components/common/search-panel.tsx 및 테스트.
- 원인: 존재하지 않는 /search?q로 이동하지만 실제 목록은 /products?keyword를 사용.
- [x] 올바른 목적지 회귀 테스트 실패 확인.
- [x] 검색 버튼/Enter 모두 /products?keyword로 연결.
- [x] 브라우저에서 검색 결과/빈 결과 확인.

## 작업 3: 구매 확정 후 뒤로가기

- 대상: src/queries/orders/mutations.ts 및 테스트.
- 원인 가설: invalidateQueries 기본값이 활성 화면만 재조회하여 비활성 주문 목록의 이전 상태가 뒤로가기 직후 표시됨.
- [x] 목록 캐시를 생성하고 화면 이탈 후 구매 확정 시나리오로 검증.
- [x] 재현되면 비활성 목록도 재조회하고 갱신 완료까지 기다리도록 수정.
- [x] 실패 시 상태 보존과 목록/상세 일치 확인.

## 작업 4: 교환/환불 사유 및 사진

- 대상: src/constants/order.ts, src/components/order/OrderExchangeRefundRequestModal.tsx 및 테스트.
- [x] 환불도 교환 사유 4종 사용, 파손 이외 사진 없이 제출, 사유 변경 시 오류 해제 테스트 실패 확인.
- [x] 사유 옵션 통일 및 상품 파손/불량에서만 사진 필수 적용.
- [x] 두 유형 모두 파손 무사진 차단, 다른 사유 허용, 직접 입력 검증.

## 완료 검증

- [x] 대상 테스트, typecheck, lint, 전체 test, build.
- [x] 전체 변경 리뷰 및 결과 문서화.
- [x] 기존 규칙에 맞는 커밋/PR로 변경 제공(자동 dev 병합하지 않음).

## 검증 결과 / 결정 기록

- 2026-09-28 최신 dev(7f9f779)에서 작업. 이슈 #103.
- 로그인: 사용자가 /login의 로그인 제출이라고 확인. 기존 코드 변경 없이 컴포넌트 테스트 및 Chrome MSW 로그인 → 홈 → 새로고침 → 마이페이지 유지 확인. 실제 Stage 계정의 성공 응답/쿠키는 확인하지 못했으므로 Stage 인증 문제 해결을 주장하지 않는다.
- 찜: 미등록 실제 API 응답(404)은 빈 하트이며 상세 진입 시 POST가 없다는 회귀 테스트 추가. 기존 등록(204) 상태 유지 테스트도 존재. 목업 상품101~108은 미리 찜되어 있으므로 임의 삭제하지 않는다.
- 검색: 기존 /search?q 연결 결함을 /products?keyword로 수정. Chrome에서 백자 47개와 카탈로그에 없는 다기 0개 확인.
- 구매 확정: 수정 전 비활성 목록 캐시가 DELIVERED로 남는 테스트 실패를 확인. 수정 후 갱신 완료까지 대기. Chrome에서 목업 주문5201 상세 확정 → 뒤로가기 → 배송 완료 목록에서 제외 → 구매 확정 목록에 표시 확인. 실패한 확정 요청은 기존 캐시 유지.
- 환불: 교환과 동일한 파손/오배송/구성품 누락/직접 입력 옵션. 파손만 필수. Chrome에서 무사진 파손 차단 및 구성품 누락 변경 시 별표/오류 해제 확인. 직접 입력의 빈 내용 차단과 사진 없는 유효 내용 제출도 테스트.
- 별도 코드 리뷰: 실제 결함 없음. 권고된 직접 입력 테스트 추가 완료.
- typecheck, lint, webpack production build 통과. 전체 테스트 최종 결과는 PR에 기록.
- 전체 테스트 1차: 197파일 중 기존 ProductToolbar.production.test.tsx의 옵션 렌더 대기 1건 실패(1166 통과). 분리 실행 5/5 통과, 동시 빌드 없이 전체 재검증: 197파일, 1169테스트 모두 통과.

## Stage 로그인 추가 수정 (2026-09-28)

사용자가 QA 주소를 https://stg.midam.store/login으로 정정하고, 추가 범위를 이메일 로그인 완료 후 홈 이동과 카카오 로그인 경로 수정으로 지정했다.

- [x] 이메일 로그인 완료와 인증된 사용자의 로그인 페이지 진입은 홈으로 통일(returnUrl 우선 복귀 정책 변경).
- [x] 실제 Stage 카카오 시작: https://api.stg.midam.store/api/member/oauth2/kakao. 브라우저에서 카카오 동의 화면 및 backend redirect_uri 확인.
- [x] 백엔드 MemberCookies의 host-only 쿠키와 Stage CORS allow-credentials 확인. Stage의 실제 /api/member/* 요청만 백엔드 호스트 + include로 통일하여 login, OAuth exchange, complete-profile, refresh, logout의 쿠키 위치 일치.
- [x] mock API, MSW 모드, 로컬·운영 origin의 기존 same-origin 동작 유지. 외부 임의 URL 입력 금지 유지.
- [x] 1차 회귀 검사에서 기존 Stage 요청 대상과 홈 이동 차이 실패 확인 후 수정. 관련 42개 테스트 통과.
- [x] 별도 리뷰: 결함 없음. 명시적 same-origin 옵션 및 origin/모드 경계 테스트 추가.
- 실제 이메일 계정 성공 응답과 카카오 동의 이후 최종 인증은 아직 미검증. 배포 전 변경이므로 현재 Stage에 반영됐다고 주장하지 않는다.
- 최종 검증: 전체 198파일/1180테스트, Stage 인증 경계 11테스트, typecheck, 실제 API 모드 webpack build 통과.
