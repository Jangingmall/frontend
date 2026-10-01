# 판매자 AI 상세페이지 MSW 시연

## 경로와 흐름

- `/seller/products/new/1`: 청자 분청 찻잔
- `/seller/products/new/2`: 전주 합죽선 매화선

사진·작품 정보가 채워진 입력 화면에서 생성하기를 누르고 가격·재고를 입력합니다. 기존 `ServerStudioInput`의 사진 업로드·생성 요청을 MSW로 처리합니다. 생성 결과는 폴더별 JSON으로 고정되어 있습니다.

생성 후에는 실제 API 경로(`/seller/products/new`)와 같은 `DocumentStudioEditor`를 사용합니다. 기존 편집기의 CSS·도구·아이콘을 재사용하고, 원본 응답 문서를 직접 편집합니다. API/MSW의 입력·저장 연결만 구분합니다.

## 프론트 편집 기능

- 선택한 페이지 뒤에 추가·복제, 드래그·위아래 이동, 확인 후 삭제
- 텍스트 / 텍스트+사진 좌·우 / 사진 1·2·3개의 여섯 가지 페이지 구성
- 문구별 직접 편집, 여섯 가지 글꼴 크기·정렬·굵기·색상, 페이지 배경
- 여러 사진 첨부·선택·교체·즉시 삭제, 갤러리의 개별 사진 선택
- 실행 취소·다시 실행, 도움말, 캔버스 확장
- 임시 저장 알림·새로고침 복원, PC·태블릿·모바일 미리보기

Figma 페이지 `77:2334`의 화면 아래 설명 박스를 기준으로 상품명은 15자, 설명·관리 방법은 각각 100자, 입력 사진은 8장·장당 10MB로 제한합니다. 편집 사진은 원본 전체를 보존하도록 최대 32장입니다. 제작 완료와 튜토리얼 시작은 설명에 명시된 MVP 제외 항목으로 비활성화합니다.

시연 결과와 편집 내용은 실제 상품 DB에 저장하지 않습니다. 생성·초기 업로드는 MSW 브라우저 메모리, 프론트 편집본은 시나리오별 localStorage에 저장합니다. 저장하면 주소에 `?draft=1`이 붙으며 새로고침해도 복원됩니다. 쿼리 없는 원래 시연 주소로 열면 입력부터 새로 시작합니다. MSW 요청 전 워커 활성 응답을 확인합니다.

## 원본 자료 보존

`studio-document-editing.ts`가 원본 JSON의 노드 구조를 유지하여 표·색상표·카드·갤러리와 모든 문구를 렌더링하고, 선택한 노드에만 수정을 반영합니다. 새 저장본은 문서·사진·미리보기 상태를 저장하며 `document-editor-storage.ts`가 예전 draft 형식 저장본도 변환합니다. 원본 Downloads 폴더는 변경하지 않습니다.

- MSW 응답: `src/api/seller-demo/mock/fixtures/{1,2}.json`
- 이미지: `public/seller-demos/{1,2}/`
- 초기 입력값: `src/api/seller-demo/scenarios.ts`
- 프론트 저장: `midam-seller-demo-frontend-{1,2}`

## 검증

타입 검사·린트·단위 테스트·빌드를 수행합니다. `seller-demo.spec.ts`는 도구와 저장 복원을, `seller-demo-fidelity.spec.ts`는 17개 섹션의 문구·이미지 및 모바일 축소를, `seller-demo-content.spec.ts`는 32장 사진·개별 서식·예전 저장본·입력 제한·여섯 가지 구성을 검사합니다. 일반 실제 API 주소로 상품·이미지·콘텐츠 요청이 나가지 않는지도 확인합니다.

```powershell
$env:NEXT_PUBLIC_DATA_MODE='api'
$env:NEXT_PUBLIC_API_MOCKING=''
$env:API_BASE_URL='http://127.0.0.1:9'
npm run dev -- --port 3109
```
