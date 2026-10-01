# 판매자 AI 상세페이지 MSW 시연

## 경로와 흐름

- `/seller/products/new/1`: 청자 분청 찻잔
- `/seller/products/new/2`: 전주 합죽선 매화선

사진·작품 정보가 채워진 입력 화면에서 생성하기를 누르고 가격·재고를 입력합니다. 기존 `ServerStudioInput`의 사진 업로드·생성 요청을 MSW로 처리합니다. 생성 결과는 폴더별 JSON으로 고정되어 있습니다.

생성 후에는 **원래 프론트 스튜디오의 `StudioEditor`와 `StudioReview`**를 사용합니다. 서버 저장 계약이 제한적인 `ServerStudioEditor`는 실제 API 경로에서만 사용합니다.

## 프론트 편집 기능

- 페이지 추가·복제·삭제·위아래 이동, 전체 배치 선택
- 제목·본문·세부 항목 편집, 글 크기·정렬·굵기·색상, 페이지 배경
- 사진 첨부·선택·교체·삭제, 갤러리의 개별 사진 선택
- 실행 취소·다시 실행, 도움말, 캔버스 확장
- 임시 저장·새로고침 복원, PC·태블릿·모바일 검토, 제작 완료

시연 결과와 편집 내용은 실제 상품 DB에 저장하지 않습니다. 생성·초기 업로드는 MSW 브라우저 메모리, 프론트 편집본은 시나리오별 localStorage에 저장합니다. 저장하면 주소에 `?draft=1`이 붙으며 새로고침해도 복원됩니다. 쿼리 없는 원래 시연 주소로 열면 입력부터 새로 시작합니다. MSW 요청 전 워커 활성 응답을 확인합니다.

## 원본 자료 보존

`demo-editor-document.ts`가 MSW 문서를 기존 draft 필드에 연결합니다. 원본 JSON의 노드 구조를 유지하여 표·색상표·카드·갤러리와 모든 문구를 그대로 렌더링하며, 편집한 값만 반영합니다. 전체 배치를 바꾸어도 원본 구조와 모든 사진을 유지하면서 사진 순서·그리드 배치를 조정합니다. 원본 Downloads 폴더는 변경하지 않습니다.

- MSW 응답: `src/api/seller-demo/mock/fixtures/{1,2}.json`
- 이미지: `public/seller-demos/{1,2}/`
- 초기 입력값: `src/api/seller-demo/scenarios.ts`
- 프론트 저장: `midam-seller-demo-frontend-{1,2}`

## 검증

타입 검사·린트·단위 테스트·빌드를 수행합니다. 브라우저 테스트는 `seller-demo.spec.ts`에서 원래 편집기 도구와 저장 복원을, `seller-demo-fidelity.spec.ts`에서 17개 섹션의 문구·이미지 및 모바일 축소를 검사합니다. 일반 실제 API 주소로 상품·이미지·콘텐츠 요청이 나가지 않는지도 확인합니다.

```powershell
$env:NEXT_PUBLIC_DATA_MODE='api'
$env:NEXT_PUBLIC_API_MOCKING=''
$env:API_BASE_URL='http://127.0.0.1:9'
npm run dev -- --port 3109
```
