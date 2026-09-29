# 판매자 실제 API 연동

기준: frontend dev 5995bc6 / backend develop 8402c5b, 2026-09-29.
브랜치: feat/seller-studio-api. 관련 이슈: #94.

## 화면과 실행

- /seller/products: 로그인한 ARTISAN의 GET /api/products/me 목록
- /seller/products/new: 실제 상품 등록 및 생성 입력
- /seller/products/new?productId=12&generationId=7: 서버 생성 상태 복원
- /seller/products/new?productId=12: 저장한 문서 조회·편집
- /seller/products/new?demo=1 또는 ?example=1: 기존 브라우저 저장 프로토타입. 서버 저장 아님.

NEXT_PUBLIC_DATA_MODE=api와 API_BASE_URL=https://api.stg.midam.store로 빌드하면 실제 API를 호출한다.
NEXT_PUBLIC_API_MOCKING=enabled는 api 모드와 함께 지정하지 않는다.
msw 모드는 같은 요청 계약을 모의 서버로 처리하며 화면에 시연임을 표시한다.
로그인 및 ARTISAN 역할이 필요하며 실제 API 모드에서는 시연 계정을 거부한다.

## 연결 흐름

1. POST /api/products: title, price, stock. 상품 등록 성공 후 URL에 productId를 기록한다.
2. POST /api/images/presigned-url: CONTENT, 320w·640w·1280w WebP 변형. 각각 PUT 성공 후 imageId만 사용한다. 스토리지에 JWT를 보내지 않는다.
3. POST /api/content/products/{productId}/generations: images 1~8, productName 15자 이내, howMade, careTips.
4. GET .../generations/{generationId}: QUEUED/PROCESSING/ANALYZING은 2초 간격 조회. COMPLETED면 문서 조회, FAILED면 사용자 재시도. 오류와 DRAFT_READY는 자동 조회를 중단한다.
5. GET .../contents: 원본 노드 ID를 유지한 reactDocument 렌더링. 허용 태그·스타일만 사용하며 임의 스크립트·HTML 실행 없음.
6. PATCH .../contents/{contentId}: 수정한 leaf text 또는 imageId만 patches로 보낸다. 실패 시 편집기와 이력을 유지한다.
7. POST .../contents/{contentId}/submit → approve → /publish. 확인 항목은 직접 체크한다. 응답의 상태로 완료를 판단한다.

서버 편집은 글·사진 교체만 제공한다. 배치·서식·노드 추가·삭제·순서는 현재 API로 저장할 수 없어 기존 AI 구성을 유지한다.

## 백엔드 연동 전 확인해야 할 제약

### DRAFT_READY에서 현재 생성 작업의 초안을 가져오는 계약

GenerationDeadlineScheduler.applyDraftReady는 생성 상태만 갱신하며 reactDocument를 저장하지 않는다.
ContentService.approve는 DRAFT_READY 작업에 대해 AI 승인 렌더를 호출한다.
하지만 프론트가 이 작업의 초안을 조회하고 검수할 연결이 없다. 기존 /contents가 있어도 이전 생성의 문서일 수 있으므로 이를 새 초안으로 취급하지 않는다.
서버가 COMPLETED와 새 reactDocument를 제공하는 경로는 편집 가능하다.
DRAFT_READY 경로는 명시적 안내와 수동 상태 조회를 제공하고 무한 로딩 또는 자동 승인하지 않는다.

### 편집 문서와 공개 상품 상세의 동기화

bulkUpdate/updateBlock은 reactDocument를 변경하지만 content_block 투영은 갱신하지 않는다.
이미지 조회 URL도 문서 imageId와 반드시 대응하는 매핑이 필요하다.
프론트는 props.src의 정상 URL 또는 응답 URL 경로에서 imageId가 정확히 일치하는 경우만 표시한다.
사진 순서만 보고 다른 이미지에 연결하지 않는다. 교체 직후는 업로드한 사진 미리보기를 보여주지만 새로고침 후 새 ID의 URL이 없으면 기본 안내를 표시한다.
서버는 수정된 AST와 content_block, 공개 상품 조회 결과를 일치시켜야 한다.

### 게시와 판매 상태

콘텐츠 PUBLISHED와 상품 ON_SALE은 별개다. 이 화면은 콘텐츠 게시 API만 호출하며 상품 판매 상태 변경을 자동으로 실행하지 않는다.
또한 백엔드가 AI 승인 렌더 실패를 로그만 남기는 경로가 있어 게시 응답만으로 공개 렌더 반영까지 보장하지 않는다.

## 검증 범위

- API 계약 및 문서 검증: 생성 요청/6종 상태, 실패 응답, patches, 승인 필드, 게시 경로, Spring Page, 악성 노드/중복 ID/깊이 제한.
- UI 회귀: 배경 재조회 오류/404에서 수정 내용 유지, 등록 성공 후 업로드 실패 재시도 시 중복 상품 생성 방지, DRAFT_READY에서 기존 문서 미표시.
- MSW E2E: 등록·3종 업로드·생성·새로고침·편집·저장·검수·게시 및 비회원/구매자 접근 제한.
- 실제 Stage 판매자 로그인, 스토리지 CORS 및 AI 완료 콜백 통합은 실제 계정으로 추가 검증이 필요하다. MSW 통과를 실제 AI 성공으로 보고하지 않는다.

## 검증 결과 (2026-09-29)

- typecheck / lint 통과.
- 단위 테스트 202파일 1,201개 통과.
- 실제 API 및 MSW 모드 production webpack 빌드 통과.
- 전체 E2E 43개 통과, 실제 백엔드 전용 1개는 기존 환경 조건에 따라 제외.
- 코드 리뷰에서 배경 재조회/404에 의한 편집 유실, 상품 등록 이후 재시도 값 불일치를 수정하고 회귀 테스트 추가.
- 포맷 검사는 기존 비추적 artifacts/issue-body.md, artifacts/pr-body.md의 오류를 제외하면 통과. 해당 기존 파일들은 수정하거나 PR에 포함하지 않음.
- [입력 화면](screenshots/seller-api/input.png), [편집 화면](screenshots/seller-api/editor.png): MSW 계약 검증 화면.
