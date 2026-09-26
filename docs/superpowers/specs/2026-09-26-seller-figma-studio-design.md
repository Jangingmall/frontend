# 판매자 AI 상세페이지 스튜디오 설계안

작성: 2026-09-26. 상태: 구현 범위 확인 대기. 제품 코드는 아직 변경하지 않았다.

## 목표와 작업 공간

Figma의 정보 입력 → AI 생성 → 편집 → 최종 확인 흐름을 Jangingmall/frontend에 구현한다. 기능의 참고 기준은 ele-003/midam-ai-detail-studio의 codex/ai-detail-studio 브랜치다. 실제 요청·응답과 인증은 Jangingmall/backend의 develop 구현에 맞춘다.

- 브랜치: codex/seller-figma-studio
- 시작점: origin/dev, dc18fd848e30354b51044c8ca8a2faf1506645c1
- 작업 공간: C:/Users/dlwnd/.codex/worktrees/seller-figma-studio/미담
- 기존 작업 폴더의 미커밋 변경은 그대로 보존한다.
- 구매자 홈을 스튜디오로 바꾸지 않는다. 판매자 경로에 화면을 추가한다.

## 확인한 디자인

파일: https://www.figma.com/design/tzD1v6k1e1wbAy6fxAMvPt?node-id=60-2

페이지 전체 대신 아래 실제 화면의 디자인 컨텍스트와 스크린샷을 확인했다.

| 노드   | 화면      | 구현 기준                                                                               |
| ------ | --------- | --------------------------------------------------------------------------------------- |
| 60:369 | 정보 입력 | 70px 판매 관리 헤더, 888px 입력 영역, 4단계 표시, 사진 첨부, 상품명·제작 과정·관리 방법 |
| 60:556 | 생성 중   | 동일 헤더와 단계 표시, 중앙 로딩, 완료·실패에 따른 전환                                 |
| 60:606 | 편집 기본 | 50px 도구 영역 + 220px 페이지 목록, 중앙 문서, 임시 저장·제작 완료                      |
| 60:844 | 최종 확인 | 편집으로 돌아가기, PC·태블릿·모바일 전환, 상품 정보와 생성 문서 확인                    |

추가 편집 상태 노드: 73:2984, 73:4134, 73:4699, 73:5252, 73:5774, 73:6015, 73:6260, 73:6513. 해당 기능 구현 전에 개별 컨텍스트를 더 조회한다.

Figma의 샘플 상품 상세 스크린샷은 완성 화면 자산으로 사용하지 않는다. 실제 상품 정보와 검증된 문서로 렌더링한다. UI 아이콘은 프로젝트와 정확히 일치하는 자산을 재사용하며, 나머지는 Figma 제공 자산을 로컬 저장한다.

## 참고 코드의 사용 범위

참고 저장소의 README와 다음 코드를 확인했다.

- src/components/detail-studio/studio-contract.ts: 허용 태그·스타일·트리 크기·중복 ID·이미지 참조 검증
- inline-edit.ts: 불변 노드 갱신, 텍스트·색상 변경, 같은 섹션 안 요소 이동
- ContractStudio.tsx: 입력과 단계 전환
- ConvertedPreview.tsx: 문서 렌더링과 편집 상태

참고 저장소는 로컬 저장 프로토타입이다. 가짜 생성 결과, localStorage 게시 상태, 샘플 상품을 실제 서버 결과로 사용하는 부분은 서비스 연동에 가져오지 않는다. 검증·렌더링·편집 로직을 프로젝트의 types/utils/components 계층으로 나누고 백엔드 DTO와 분리한다.

백엔드 테스트에는 최상위 h2·p·img도 존재하므로, 참고 코드의 최상위 section 강제 규칙을 그대로 적용하면 정상 응답을 거부한다. 원본 노드 ID를 유지하며 화면용 그룹만 분리한다. ID를 재발급하면 PATCH가 실패하므로 금지한다.

## 현재 백엔드 계약

근거: backend의 content/presentation/GenerationRequest.java, ContentController.java, ContentRequest.java, content/application/ContentResponse.java, ContentService.java, image/presentation/ImageController.java, image/application/ImageService.java, product/presentation/ProductRequest.java.

| 동작               | 실제 API 및 핵심 계약                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 상품 생성          | POST /api/products. title, 양수 price, 0 이상 stock. 선택적 categoryId/subcategoryId/images 등                      |
| 내 상품            | GET /api/products/me. Spring Page 응답                                                                              |
| 이미지 업로드 준비 | POST /api/images/presigned-url. PRODUCT 또는 CONTENT 목적, 원본 크기, 320w·640w·1280w 변형                          |
| 파일 전송          | 발급된 업로드 URL에 WebP PUT. JWT를 S3에 보내지 않는다                                                              |
| AI 생성            | POST /api/content/products/{productId}/generations. images 1~8개, productName 필수·최대 15자, howMade·careTips 필수 |
| 생성 상태          | GET /api/content/products/{productId}/generations/{generationId}. PROCESSING, QUEUED, COMPLETED, FAILED             |
| 문서 조회          | GET /api/content/products/{productId}/contents. contentId, productId, status, version, reactDocument, 선택적 blocks |
| 일괄 편집 저장     | PATCH /api/content/products/{productId}/contents/{contentId}. patches: [{nodeId, text?, imageId?}]                  |
| 노드 하나 저장     | PATCH .../contents/{contentId}/blocks/{nodeId}. text?, imageId?                                                     |
| 검수 요청          | POST .../contents/{contentId}/submit                                                                                |
| 검수 확인          | POST .../contents/{contentId}/approve. factCheckConfirmed, photoMatchConfirmed, displayApprovalBadge                |
| 게시               | POST /api/content/products/{productId}/publish                                                                      |

현재 PATCH는 문구·이미지를 바꾸며 AI의 스타일과 레이아웃은 보존한다. 문서 전체 교체, 섹션 추가·삭제·재정렬, 글자색·서식 변경을 저장하는 API가 아니다. 과거 blocks 교체 형식으로 요청하면 현행 API와 맞지 않는다.

## 범위 선택이 필요한 부분

### A. 현재 API에 맞춘 프론트엔드 구현 (권장)

입력·업로드·실제 생성·상태 조회·문서 렌더링·텍스트 및 이미지 교체·되돌리기·다시 실행·서버 임시 저장·화면 크기별 미리보기·검수 및 게시 흐름을 구현한다. 미지원 서식/구조 편집 도구는 연결 지점과 기능 지원 여부를 분리해 준비하고, 저장되지 않는 변경을 가능하다고 표시하지 않는다.

장점: 백엔드 변경 없이 기존 서비스 계약과 일치한다. 단점: Figma와 참고 코드의 서식·구조 편집 전체를 실제 게시 결과까지 반영할 수 없다.

### B. 백엔드 확장 포함

프론트엔드와 별도로 backend 새 브랜치에서 문서 변경 계약을 확장한다. 서버 소유권·허용 AST 검증·이미지 소유권·버전 충돌·공개 상세 조회 반영까지 함께 변경한다. 기존 텍스트 PATCH와 호환되는 별도 문서 갱신 계약을 설계해야 한다.

장점: Figma 편집 기능 전체를 서버 저장할 수 있다. 단점: 백엔드 수정·테스트·배포가 추가되며 프론트엔드만 배포해서는 동작하지 않는다.

## 프론트엔드 구조

- app/(protected)/seller: ARTISAN 가드와 판매자 레이아웃. 구매자 GNB·푸터와 판매자 헤더의 중복을 피한다.
- app/(protected)/seller/products: 서버에서 저장한 내 상품 목록과 작업 재개 진입.
- app/(protected)/seller/products/new: 입력 화면. 기존 상품 ID가 있으면 그 상품에 생성한다.
- app/(protected)/seller/products/[productId]/studio: 기존 문서 조회·편집·최종 확인.
- api/seller-studio: DTO 검증, 응답 매핑, 업로드·생성·문서·검수 API.
- queries/seller-studio: 조회·polling·mutation·캐시 무효화. 화면에서 REST 직접 호출 금지.
- types/detail-document 및 utils/detail-document: 검증된 문서 모델과 노드 편집 함수.
- components/detail-studio: 문서 렌더러와 편집기. 기존 Button, InputField, Textarea, Breadcrumb, 아이콘·토큰 사용.

기존 clientFetch의 메모리 토큰·401 단일 갱신·same-origin rewrite를 사용한다. 별도 BFF 또는 localStorage 토큰 저장은 만들지 않는다.

## 사용자 흐름과 오류 처리

1. 신규 상품에는 가격·재고가 필요하다. 디자인에 없는 임의 가격을 넣지 않고 생성 전 상품 기본정보에서 입력받는다. 기존 상품 진입은 추가 입력 없이 기존 상품을 사용한다.
2. 사진 파일 수·형식·크기를 검증하고 변형 생성과 S3 업로드가 모두 성공한 이미지만 생성 요청에 쓴다. 미리보기 blob URL은 해제한다.
3. 생성 요청 202 응답의 generationId를 보존해 새로고침 후 상태 조회를 재개한다. 중복 생성 방지, polling 종료·컴포넌트 해제 처리를 포함한다.
4. FAILED·통신 오류·잘못된 JSON은 명확한 오류와 재시도를 제공한다. 실패를 샘플 생성 성공으로 바꾸지 않는다.
5. 생성 문서는 허용 요소와 스타일만 렌더링한다. eval·임의 HTML 삽입·이벤트 속성 실행은 사용하지 않는다.
6. 저장은 변경된 노드만 PATCH한다. 서버 성공을 확인한 뒤 저장 완료로 표시하고, 실패하면 입력 상태를 유지한다.
7. 최종 확인의 화면 크기 전환은 같은 문서를 표시한다. 검수 확인 항목은 사용자가 직접 체크한다. publish 성공 전 게시 완료라고 표시하지 않는다.
8. 변경 중 이탈, 저장 중 중복 요청, 인증 만료·권한 부족 상태를 처리한다.

## 검증과 완료 기준

- 계약 테스트: 실제 DTO, 요청 경로/본문, 이미지 변형, PROCESSING/QUEUED polling, FAILED, 저장 실패, 검수·게시 상태 전이.
- 문서 테스트: 백엔드 AST와 참고 fixture, 중복 ID·과도한 깊이·미허용 태그/스타일·유효하지 않은 이미지 참조 거부, 편집·undo/redo.
- E2E: API 모킹을 사용한 입력→생성→편집→저장→새로고침 복원→최종 확인, 실패·재시도, 모바일 미리보기. 실제 AI 호출 성공과 구분한다.
- 1440px Figma 스크린샷 대비 UI 검토. 정적 자산 파일·배치·크기 확인.
- 필수: npm run typecheck, npm run lint, npm run test, npm run build.
- 실제 배포 API의 인증·업로드·AI 생성·게시 검증은 접근 가능한 환경과 판매자 계정으로 별도 확인한다.

## 현재 상태

새 브랜치와 의존성 설치를 완료했다. 구현 전 전체 테스트: 182개 파일 중 181개 통과, 1,117개 테스트 중 1,116개 통과. ProductToolbar.production.test.tsx의 옵션 표시 테스트 1개가 실패했다. 해당 파일만 재실행하면 5개 모두 통과했다. 간헐적 실패 가능성이 있으며 원인은 아직 확정하지 않았다. 범위 A/B 결정 후 문서와 구현 계획을 확정한다. 아직 제품 코드·백엔드 코드·원격 브랜치를 변경하지 않았다.
