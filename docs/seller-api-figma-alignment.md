# 판매자 실제 API 화면 Figma 적용

- 이슈: #146 (기존 실제 API 화면 정렬: #119)
- 브랜치: feat/seller-msw-demos
- 최신 기준: Figma `tzD1v6k1e1wbAy6fxAMvPt` 페이지 `77:2334`의 화면 아래 설명 박스(2026-10-02 반영, 댓글 제외)
- 실제 API 경로: /seller/products/new (demo 쿼리 없음)

## 원인

시연용 SellerStudio와 실제 API용 ServerSellerStudio가 서로 다른 폼과 편집 UI를 사용하고 있었습니다. 기존 1차 QA는 실제 API 폼의 배치까지 통일하지 못했습니다.

## 변경

- 입력 화면의 888px 본문, 114px 사진 타일, 상품명 15자, 설명·관리 방법 각 100자, 62px 텍스트 영역, 필수 오류·글자 수·최대 8장 안내. Footer는 제외
- 생성 화면은 단계 표시와 중앙 대기 안내 적용. 실패·초안 확인·재조회 분기는 보존
- 실제 API와 MSW가 `DocumentStudioEditor`를 공유. 페이지 추가·드래그 정렬·복제·삭제 확인, 여섯 가지 레이아웃, 여섯 가지 개별 글자 서식, 사진 첨부·교체·삭제, 실행 취소·다시 실행·도움말·저장 알림 적용
- 최종 확인은 PC·태블릿·모바일, 상품 사진·판매 정보, 수정 중인 실제 문서를 함께 표시. 상품 기본정보 조회 실패가 문서 미리보기를 막지 않음
- 신규 상품 API가 요구하는 가격·재고는 생성하기 이후 별도 창에서 입력. 기존 productId는 이 창 없이 생성. 등록 후 업로드 실패 시 기존 상품 ID와 업로드 성공 사진 재사용

## API와 디자인 차이

- 상품 생성 API의 가격·재고 필수 계약 때문에 신규 상품에서 추가 입력 창이 필요합니다. 임의의 가격·재고를 보내지 않습니다.
- 문서 수정 API는 기존 노드의 텍스트·이미지 교체 패치만 지원합니다. 프론트 편집 기능은 모두 제공하며, 페이지 추가·순서·서식 등을 포함한 전체 편집본은 브라우저에 저장합니다. 서버 지원 수정은 기존 PATCH로 전송합니다. API 저장 실패 시 화면의 편집 내용을 유지합니다.
- 실제 API 편집본은 사용자·상품·콘텐츠별로 분리하고 서버 문서 버전이 일치할 때만 복원합니다. 서버가 지원하지 않는 구조·서식은 다른 기기나 공개 상품 화면에 동기화되지 않습니다. 새 노드 ID를 기존 서버 노드처럼 PATCH하지 않습니다.
- 제작 완료와 튜토리얼 시작은 최신 설명의 MVP 제외 항목으로 비활성화합니다. 별도 미리보기 버튼으로 PC·태블릿·모바일 화면을 확인합니다.
- 상품 가격·재고는 GET /api/products/{productId}의 응답을 검증하고 표시합니다. 비공개 초안 등으로 조회할 수 없으면 확인 필요 안내를 표시합니다. 배송·옵션은 이 문서 API에 없으므로 임의 정보를 만들지 않습니다.
- 상세 본문 자체는 reactDocument의 내용과 서식을 보존합니다. Figma의 예시 작품 문구나 사진으로 실제 AI 응답을 대체하지 않습니다.
- Stage 판매자 인증/실제 AI 생성 성공 여부는 UI 계약 검증과 별개입니다. 이번 브라우저 검증은 MSW 응답을 사용하는 동일 API용 컴포넌트로 진행했습니다.

## 기존 구현의 시각 자료

- docs/screenshots/seller-api/input.png
- docs/screenshots/seller-api/editor.png
- docs/screenshots/seller-api/review.png

위 캡처는 이전 구현 기록입니다. 최신 공통 편집기의 브라우저 테스트 캡처는 `artifacts/`에 생성하며, 시연 경로에는 MSW 안내 띠를 표시하지 않습니다.

## 실제 요청 흐름

Stage API 호스트는 `https://api.stg.midam.store`이며 브라우저의 같은 출처 `/api/*` 요청을 Next.js 프록시로 전달합니다.

| 순서 | 요청                                                             | 용도                                                 |
| ---- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| 1    | POST /api/products                                               | 신규 상품만 `{title, price, stock}`으로 상품 ID 생성 |
| 2    | POST /api/images/presigned-url                                   | CONTENT 사진의 320w·640w·1280w WebP 업로드 URL 발급  |
| 3    | PUT 발급받은 presignedUrl                                        | 각 크기 사진 파일 업로드                             |
| 4    | POST /api/content/products/{productId}/generations               | 사진 ID와 입력 내용으로 AI 생성 시작                 |
| 5    | GET /api/content/products/{productId}/generations/{generationId} | 약 2초 간격으로 생성 상태 조회                       |
| 6    | GET /api/content/products/{productId}/contents                   | 실제 reactDocument JSON을 받아 화면 렌더링           |
| 7    | PATCH /api/content/products/{productId}/contents/{contentId}     | `{patches:[{nodeId,text?,imageId?}]}`로 수정 저장    |
| 8    | GET /api/products/{productId}                                    | 최종 확인 화면의 실제 상품명·가격·재고 조회          |

생성 요청 본문:

```json
{
  "images": ["업로드한 이미지 ID"],
  "productName": "상품명",
  "howMade": "제작 과정 및 상품 설명",
  "careTips": "사용 및 보관 관리 방법"
}
```

검수·게시 API 함수와 계약은 유지하지만 최신 스튜디오 UI에서는 호출하지 않습니다. 프론트가 AI 제공자에 직접 요청하지 않습니다.

## 기존 구현 검증 기록

- 전체 단위 테스트: 218파일, 1354개 통과
- 판매자 변경 관련 추가 확인: 3파일, 6개 통과
- 상품 목록 보조 파일 이름 변경 회귀 확인: 3파일, 10개 통과
- Chromium 판매자 등록·생성·편집·검수·게시 및 권한 경계: 2개 통과 (MSW 계약 테스트)
- 타입 검사, ESLint, 프로덕션 webpack 빌드 통과
- 빌드 중 기존 products/_lib/layout.ts가 Next.js 레이아웃으로 검사되는 오류를 재현해 product-list-layout.ts로 이름만 변경하고 참조 3곳을 갱신했습니다. 화면 동작은 변경하지 않았습니다.

## 최신 회귀 검증 범위

`ServerStudioEditor.test.tsx`는 실제 공통 UI와 MSW API로 PATCH 성공·실패, 구조 편집의 브라우저 복원, 사용자·서버 버전 격리, 이탈 전 저장, 업로드와 읽기 전용 상태를 검사합니다. `seller-api.spec.ts`는 판매자 권한 및 입력·생성·편집·저장·기기별 미리보기를 검사합니다. 이전 검수·게시 클릭 시나리오는 MVP 제외에 맞춰 제작 완료 버튼의 비활성 상태 확인으로 변경합니다.

2026-10-02 검증: 전체 단위 테스트 240파일·1,531개, MSW 시연 브라우저 테스트 10개, 실제 API용 컴포넌트의 MSW 계약 브라우저 테스트 2개를 통과했습니다. 타입 검사·ESLint·Turbopack 프로덕션 빌드도 통과했습니다. 저장 후 쿼리 캐시가 남은 상태로 재진입해도 서버 버전과 브라우저 편집본이 일치하도록 검증했습니다.
