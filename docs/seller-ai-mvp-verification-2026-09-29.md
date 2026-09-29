# 판매자 AI 상세페이지 MVP 실제 API 확인 (2026-09-29)

## 현재 판정

**실제 API 연결 코드는 존재하지만 실제 생성·편집·저장 성공은 확인하지 못했다.** 최초에는 기존 계정의 USER 권한으로 차단되었다. 이후 사용자가 판매자 테스트 계정을 제공하여 로그인 화면에서 재검증했으나 로그인 API가 HTTP 401 UNAUTHORIZED를 반환했다. 현재는 테스트 계정 인증이 선행되어야 한다.

## 테스트 계정으로 재검증한 결과

- 기존 세션을 정상 로그아웃한 뒤 스테이징 로그인 화면에서 사용자가 제공한 판매자 테스트 계정을 입력했다.
- 브라우저 실제 입력값이 제공된 이메일·비밀번호와 일치하는지만 비교하여 오타가 아님을 확인했다. 비밀번호·토큰 원문은 문서나 파일에 저장하지 않았다.
- 요청: POST https://api.stg.midam.store/api/member/login
- 응답: HTTP 401, errorCode UNAUTHORIZED, message 인증이 필요합니다.
- 화면: 아이디 또는 비밀번호를 확인해주세요!
- 현재 원인은 계정 정보/배포 환경/서버 인증 처리 중 어느 것인지 확정하지 않았다. 이 결과를 AI 생성 API 실패로 분류하지 않는다.
- 사용자에게 스테이징 계정 등록 여부 확인 또는 직접 로그인 진행을 요청했다. 계정 권한 변경, 관리자 로그인, 상품 생성, 사진 업로드, AI 생성 요청은 하지 않았다.

## 직접 확인한 실서버 결과

| 검사                                                         | 결과                                   | 의미                                                     |
| ------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------- |
| `https://stg.midam.store/seller/products/new`                | 화면에 `판매자 계정이 필요합니다` 표시 | 실제 제작 폼 진입 불가. 시연 화면으로 우회하지 않음.     |
| `POST https://api.stg.midam.store/api/member/token/refresh`  | 토큰 갱신 성공                         | 기존 로그인 세션 사용. 토큰은 로그·파일에 저장하지 않음. |
| `GET https://api.stg.midam.store/api/member/me`              | HTTP 200, `role: USER`                 | 판매자 계정이 아님. 개인정보 본문은 기록하지 않음.       |
| `GET https://stg.midam.store/api/products/me?page=0&size=20` | HTTP 403, `FORBIDDEN`                  | 실제 서버도 판매자 조회를 거절함.                        |

상품 생성, 사진 업로드, AI 생성, 문서 저장, 제출·승인·게시 요청은 실행하지 않았다. 계정 권한을 변경하거나 우회하지 않았고 테스트 상품도 생성하지 않았다.

## 프론트가 호출하는 실제 엔드포인트

| MVP 단계             | 메서드·엔드포인트                                                     | 현재 검증 상태                                                            |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 내 상품 조회         | `GET /api/products/me?page=0&size=20`                                 | 실서버 403 확인. 정상 판매자 응답 미검증.                                 |
| 작업용 상품 등록     | `POST /api/products`                                                  | `{title, price, stock}` 연결 코드 있음. 실서버 쓰기 미검증.               |
| 사진 업로드 URL 발급 | `POST /api/images/presigned-url`                                      | `purpose: CONTENT` 및 이미지 변형별 업로드 연결 코드 있음. 실서버 미검증. |
| 사진 전송            | 응답의 presigned URL에 `PUT`                                          | 실제 저장소 업로드 연결 코드 있음. 실서버 미검증.                         |
| AI 생성 시작         | `POST /api/content/products/{productId}/generations`                  | `{images, productName, howMade, careTips}` 연결 코드 있음. 실서버 미검증. |
| AI 생성 상태 조회    | `GET /api/content/products/{productId}/generations/{generationId}`    | 2초 폴링. COMPLETED/FAILED/DRAFT_READY 또는 오류에서 중지. 실서버 미검증. |
| 생성 문서 조회       | `GET /api/content/products/{productId}/contents`                      | 서버 `reactDocument` 파싱·렌더링 연결 코드 있음. 실서버 미검증.           |
| 편집 저장            | `PATCH /api/content/products/{productId}/contents/{contentId}`        | `{patches}` 저장 연결 코드 있음. 실서버 미검증.                           |
| 검수 요청            | `POST /api/content/products/{productId}/contents/{contentId}/submit`  | 연결 코드 있음. 실서버 미검증.                                            |
| 승인                 | `POST /api/content/products/{productId}/contents/{contentId}/approve` | 확인 항목과 함께 요청하는 코드 있음. 실서버 미검증.                       |
| 반려                 | `POST /api/content/products/{productId}/contents/{contentId}/reject`  | 연결 코드 있음. 실서버 미검증.                                            |
| 게시                 | `POST /api/content/products/{productId}/publish`                      | 연결 코드 있음. 실서버 미검증.                                            |

## 계약과 시연 경로 주의점

- 기본 `/seller/products/new`는 `ServerSellerStudio`로 진입한다. `demo=1`, `example=1`, `project` 쿼리는 별도 시연 경로이며 실제 API 검증 근거로 사용하지 않는다.
- 이번에 다시 받은 공개 OpenAPI에는 `/api/content/...` 경로가 포함되어 있지 않았다. 반면 백엔드 develop `1ca01fa6139b45a0bd3245c366ae7e7adb7f2012`의 `GenerationController`, `ContentController`에는 위 경로와 `ARTISAN` 권한 검사가 존재한다. 문서 누락만으로 서버 API가 없다고 판단하지 않는다. 코드 존재만으로 배포 성공이라고 판단하지도 않는다.
- 서버가 `DRAFT_READY`를 반환하면 현재 프론트는 초안 조회·승인 연결 부재 안내에서 멈춘다. `COMPLETED`를 받는 경우에만 문서 편집으로 진행한다. 실제 생성이 어느 상태에 도달하는지는 아직 미검증이다.

## 자동 테스트

`npm run test -- src/api/seller-studio src/app/seller/products/new/_components/ServerSellerStudio.test.tsx src/app/seller/products/new/_components/ServerStudioInput.test.tsx src/app/seller/products/new/_components/ServerStudioEditor.test.tsx src/api/images/api.test.ts --maxWorkers=3`

**5파일 / 22개 통과.** 응답 대역을 사용하는 계약·컴포넌트 테스트이며 실제 AI 생성 성공의 증거가 아니다.

## 검증 재개 조건

스테이징 Chrome에서 승인된 판매자 계정으로 로그인한 후 기본 제작 경로에서 테스트용 상품·사진으로 생성 요청 → 상태 완료 → 서버 문서 렌더링 → 편집 저장 및 재조회까지 확인한다. 기존 상품을 덮어쓰거나 실제 상품을 게시하는 동작과 구분한다.

## 참고

- [판매자 제작 화면](https://stg.midam.store/seller/products/new)
- [API 요약](https://jangingmall.github.io/backend/summary.html)
- `src/api/seller-studio/api.ts`
- `src/app/seller/products/new/_components/ServerStudioInput.tsx`
- `src/app/seller/products/new/_components/ServerSellerStudio.tsx`
- `src/queries/seller-studio/queries.ts`
