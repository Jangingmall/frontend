# 판매자 AI 상세페이지 MSW 시연

## 경로와 응답

- `/seller/products/new/1`: 청자 분청 찻잔 (`cheongja-buncheong/react_document.json`)
- `/seller/products/new/2`: 전주 합죽선 매화선 (`hapjukseon-maehwa-v2/react_document.json`)

두 경로 모두 사진·작품 정보 입력에서 시작합니다. 생성하기 → 텍스트 편집 → 임시 저장·저장본 불러오기 → PC/태블릿/모바일 미리보기 → 제작 완료를 시연할 수 있습니다.

입력값과 사진은 변경할 수 있지만 생성 결과는 경로별 제공 JSON으로 고정됩니다. 실제 AI 생성, 이미지 업로드, 상품 게시는 수행하지 않습니다. 저장은 MSW의 브라우저 메모리에만 유지되며 새로고침하면 입력 화면으로 돌아갑니다. 기존 `/seller/products/new`의 실제 API 흐름은 유지합니다.

## 로컬 실행

```powershell
$env:NEXT_PUBLIC_DATA_MODE='api'
$env:NEXT_PUBLIC_API_MOCKING=''
npm run dev -- --port 3109
```

API 모드에서도 위 시연 화면의 `/api/mock/seller-demos/1`, `/api/mock/seller-demos/2` GET/POST/PUT 요청만 MSW로 처리합니다. 백엔드는 필요하지 않습니다. 요청의 `X-Studio-Session`으로 각 생성 세션의 편집 결과를 분리합니다.

## 자료 위치

- 응답 원본: `src/api/seller-demo/mock/fixtures/{1,2}.json`
- 시나리오 입력값: `src/api/seller-demo/scenarios.ts`
- 이미지: `public/seller-demos/{1,2}/`

첫 번째 폴더에 원본 사진이 없어 사용자의 승인에 따라 제공된 hero, detail_split, usage_scene 섹션 PNG에서 작품 사진 영역을 추출했습니다. 두 번째 시나리오는 제공된 photos 파일을 사용합니다. 원본 폴더는 수정하지 않습니다.

## 검증

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- 실행 중인 로컬 서버에 대해 `PLAYWRIGHT_BASE_URL`을 설정하고 `npx playwright test src/e2e/seller-demo.spec.ts` 실행 (프로젝트 Playwright 설정의 환경 변수 확인)

E2E는 각 경로에서 생성·텍스트 수정·저장·재조회·미리보기·완료와 실제 판매자 API 요청 부재, 미지원 시나리오의 404를 확인합니다.

## 섹션 PNG 기준 복원

제공 JSON은 PNG와 별도 결과로, 갤러리·카드·목록 등 일부 내용이 누락되어 있습니다. 시연 fixture는 원본 sections PNG를 기준으로 보충했습니다. 원본 Downloads 파일은 유지합니다.

- 찻잔: 제작 이야기 번호/가로 배치, 갤러리 5장, 디테일/사용 장면 좌우 배치, 제품 정보 표, 관리 목록 3개, 마무리 정렬 복원
- 합죽선: 소개 문구, 제작 이야기 번호/가로 배치, 색상 표시 3개 및 packshot 연결, 갤러리 5장, 추천 카드 3개, 관리 목록과 마무리 정렬 복원
- 두 갤러리는 PNG의 사진별 크롭까지 보존하기 위해 해당 사진 영역을 추출한 WebP를 사용합니다. 섹션 전체를 이미지로 치환하지 않으며 제목·본문·카드·표는 편집 가능합니다.
- 스타일은 시연 fixture와 `.seller-demo` 범위에만 적용합니다. 실제 판매자 문서 파서/렌더러는 변경하지 않습니다.
- 브라우저 검증: `src/e2e/seller-demo-fidelity.spec.ts`에서 이미지 로딩, 갤러리/카드 수, 좌우 배치를 검사하고 17개 섹션을 개별 캡처합니다.
