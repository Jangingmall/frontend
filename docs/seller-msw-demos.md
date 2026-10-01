# 판매자 AI 상세페이지 MSW 시연

## 경로

- `/seller/products/new/1`: 청자 분청 찻잔
- `/seller/products/new/2`: 전주 합죽선 매화선

두 경로는 기존 `ServerSellerStudio`를 그대로 사용합니다. 입력, 가격·재고 모달, 사진 업로드, 생성 상태 조회, 편집, 사진 교체, 실행 취소/다시 실행, 저장·재조회, 상품 미리보기, 검수·승인·게시 UI를 별도로 구현하지 않습니다.

## 시연 방법

1. 사진·상품명·제작 과정·관리 방법은 제공 자료로 채워져 있습니다. 필요하면 변경합니다.
2. 생성하기를 누르고 기존 상품 기본정보 모달에 가격·재고를 입력합니다.
3. 생성 완료 후 기존 왼쪽 목록에서 문구와 사진을 선택해 편집합니다.
4. 임시저장, 서버 문서 다시 조회, 최종 검토하기를 사용할 수 있습니다.
5. 제작 완료하기에서 검수 요청 → 사실·사진 확인 → 승인 → 콘텐츠 게시 순서를 진행합니다.

모든 생성·저장·게시 결과는 MSW 브라우저 메모리에만 있습니다. 실제 AI·상품 DB·S3는 호출하지 않습니다. 생성 결과는 입력 내용에 따라 달라지지 않는 경로별 고정 문서입니다. 새로고침하면 새 시연 세션의 입력 화면으로 돌아갑니다.

## 기존 코드 재사용

`SellerDemoStudio`는 초기 자료를 읽고 `SellerStudioRuntimeContext`에 시연 연결을 제공하는 래퍼입니다. 별도 편집 UI나 편집 상태를 갖지 않습니다.

기본 컨텍스트는 기존 API·업로더·인증·URL을 사용합니다. 시연 컨텍스트는 같은 API 함수와 응답 검증을 사용하면서 전송 경로만 `/api/mock/seller-demos/{1,2}/api/...`로 변경합니다. 쿼리 캐시와 MSW 데이터는 시나리오·세션별로 분리합니다. 시연 경로에서만 인증 경계를 건너뛰고 실제 인증 상태는 바꾸지 않습니다.

사진 업로드도 기존 압축 → presigned URL → PUT 흐름을 재사용합니다. 시연용 URL은 같은 origin의 `/api/mock/seller-demos/{1,2}/uploads/...`이며 MSW가 바이너리를 메모리에 보관합니다. 원본 사진으로 실행 취소한 뒤 저장하는 경우도 지원합니다.

## PNG 기준 문서

- 시연 응답: `src/api/seller-demo/mock/fixtures/{1,2}.json`
- 자료: `public/seller-demos/{1,2}/`
- 초기 입력값: `src/api/seller-demo/scenarios.ts`

제공 JSON에서 빠진 갤러리·카드·목록을 sections PNG와 대조해 보충했습니다. 갤러리 사진은 해당 PNG의 사진 영역을 추출해 크롭을 보존합니다. 문구·카드·표는 편집 가능한 문서 요소로 유지합니다. 원본 Downloads 파일은 수정하지 않습니다.

문서 렌더러의 `fitCanvas` 옵션은 시연 문서의 774px 구성을 미리보기 너비에 맞춰 비례 축소합니다. 기존 실제 경로에서는 기본값(false)을 사용합니다.

## 실행 및 검증

```powershell
$env:NEXT_PUBLIC_DATA_MODE='api'
$env:NEXT_PUBLIC_API_MOCKING=''
npm run dev -- --port 3109
```

백엔드 없이 시연할 수 있습니다. 타입 검사·린트·단위 테스트·빌드를 수행하고, 위 서버 실행 후 다음 브라우저 검사를 실행합니다.

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3109'
npx playwright test src/e2e/seller-demo.spec.ts src/e2e/seller-demo-fidelity.spec.ts
```

브라우저 검사는 기존 화면의 전체 제작 흐름, 사진 교체·실행 취소·저장, 실제 판매자 API 호출 부재, 17개 섹션 내용과 이미지 로딩, 모바일 캔버스를 확인합니다. 캡처는 `artifacts/`에 저장됩니다.
