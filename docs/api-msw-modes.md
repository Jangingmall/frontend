# 현재 화면의 API / MSW 연결

> 2026-09-29 변경: API 모드의 모든 시연 연결을 비활성화했습니다. 현재 동작과 배포 설정은 [스테이징 실제 API 모드 정리](staging-live-checkout-2026-09-29.md)를 따릅니다. 아래 표와 검증 결과는 변경 전 감사 기록입니다.

기준: backend `48417a651476c57606ff7567ea8b204962acf9c0` (2026-09-28 구현 감사), frontend `dev` 기반 `feat/api-msw-modes`. 이슈 #96, PR #97.

## 실행

```powershell
npm run dev:msw
# 별도 터미널/서버에서 API 모드 실행
$env:API_BASE_URL="http://localhost:8080"
npm run dev:api
```

`.env.local`의 `NEXT_PUBLIC_DATA_MODE=msw|api`로 `npm run dev`도 실행할 수 있다. 레거시 `NEXT_PUBLIC_API_MOCKING=enabled`는 호환되지만 `api`와 함께 설정하면 오류다. 모드 변경 후 서버 재시작/재빌드가 필요하다. `dev:api`는 백엔드 주소 누락과 프론트엔드 자신을 향한 localhost 주소를 거부한다. 실서버 주소·토스 키·웹훅 시크릿은 저장소에 커밋하지 않는다.

| 모드 | 구현된 기능 | 미구현/제한 기능         |
| ---- | ----------- | ------------------------ |
| msw  | MSW         | MSW                      |
| api  | 실제 백엔드 | 명시적 `/api/mock/*` MSW |

`lib/data-mode.ts`의 정책을 브라우저와 Node SSR이 공유한다. API 모드 SSR은 MSW `getResponse`를 서버 fetch 경계에 등록해 사용하며 Next의 HTTP 프록시를 전역 가로채지 않는다. 전역 Node 인터셉터가 실제 프록시 요청을 대기시키는 문제를 브라우저 검증에서 확인해 분리했다. API 모드에서 일반 `/api/*` 요청은 통과하고 `/api/mock/*`만 가로챈다. 미등록 시연 요청은 501이다. 실제 401·404·500·빈 목록을 목업 성공으로 대체하지 않는다. 전체 MSW는 기존대로 Vercel production에서 차단한다. API 모드의 시연 계정은 실제 권한을 부여하지 않는다.

## 화면별 연결

| 화면/기능                             | API 모드                                       | 코드/계약                                                                                                                             |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 홈 신상품·선물                        | 실제 상품 목록                                 | `api/products/api.ts`; 0-based pageable 변환                                                                                          |
| 홈 베스트·기획전                      | MSW 카탈로그 정렬                              | 판매량/찜 정렬 미지원. 기획전은 기존 비활성 카드 구성 유지                                                                            |
| 홈 장인관                             | 실제 `/api/member/artisans`                    | `api/home/api.ts`; 실제 nullable 값 존중. MSW는 기존 장인 시연 응답                                                                   |
| 상품 목록/검색/가격/최신순            | 실제 목록·분류·소분류                          | `api/products/backend-list.ts` 및 `backend-mapper.ts`                                                                                 |
| 소재 선택지                           | 실제 `/api/products/materials?subcategoryId=N` | `string[]` 검증. 소분류 없는 요청은 하지 않음; 실제 빈 결과에 가짜 소재를 채우지 않음                                                 |
| 소재·공예·포장·인기/판매/찜 필터      | 결과 전체 MSW                                  | `api/products/demo-query.ts`; 실분류 ID를 이름으로 시연 분류에 변환. 시연 카탈로그는 키친·다이닝 범위, 미매핑 분류는 오류 안내        |
| 상품 상세/찜                          | 실제 API                                       | 시연 목록의 카드는 `preview=1` 유지, 시연 상품 ID를 실제 구매·찜 요청에 사용하지 않음                                                 |
| 재입고                                | MSW                                            | `/api/mock/products/:id/restock`, 사용자별 상태                                                                                       |
| 일반 후기/내 후기/후기 작성           | 실제 API                                       | `api/reviews`; 공개 이미지 ID를 URL로 추측하지 않음                                                                                   |
| 사진 후기 필터                        | MSW                                            | 응답 영역에 시연 안내                                                                                                                 |
| 상품 문의 조회/작성                   | MSW                                            | 백엔드가 비밀 답변을 비작성자에게 직렬화하는 제한. 원본 응답을 가져온 뒤 가리는 방식도 사용하지 않음                                  |
| 이메일 로그인/가입/코드 인증/카카오   | 실제 회원 API                                  | `api/member/api.ts`; 문서의 옛 링크 인증 경로 대신 코드 발급·확인 계약 사용                                                           |
| 네이버 로그인                         | MSW 격리 계정                                  | `/api/mock/member/oauth2/naver`; 이후 계정/거래 요청은 `/api/mock/session/*`. 새로고침에서도 실제 계정과 구분                         |
| 계정/비밀번호/탈퇴/설정/배송지        | 실제 API                                       | `api/member`; 네이버 데모 세션만 MSW                                                                                                  |
| 찜·최근 본 상품                       | 실제 API                                       | `api/wishlist`, `api/recent-views`; 상세 열람 시 기록 POST                                                                            |
| 장바구니 조회·담기·수량·삭제·병합     | 실제 API                                       | `api/cart`; MSW 카탈로그 장바구니는 별도 `/api/mock/purchase/cart`                                                                    |
| 장바구니 옵션 변경                    | 전체 장바구니 MSW 복사                         | 실제 옵션 정의·추가금액 계약 미제공. 시연임을 알리고 변경 후 `cart?preview=1`로 이동                                                  |
| 카드·간편결제·계좌이체                | 실제 주문/결제 API                             | `api/payments`; 서버 금액과 주문 ID 검증 유지                                                                                         |
| 할인코드·쿠폰·적립금·무통장입금       | 주문 전체 MSW                                  | `/api/mock/purchase/benefits`, `/benefits/apply`, `/orders`; 시연 할인은 실제 금액과 합성하지 않음. 실제 주문 생성/PG를 호출하지 않음 |
| 주문 목록·상세·배송·구매확정·주소변경 | 실제 API                                       | `api/orders`; 상태별 허용 조건 유지                                                                                                   |
| 미결제 주문 취소                      | 실제 주문 전체 취소                            | `POST /api/payments/orders/:id/cancel`                                                                                                |
| 결제된 주문 취소 / 취소 사진          | MSW 접수 시연                                  | `/api/mock/orders/:id/cancel-request`; 실제 취소·환불 상태는 바꾸지 않으며 완료 문구에 시연 표시. 첨부는 파일 메타데이터만 시연       |
| 교환·반품                             | 실제 API                                       | `POST /api/payments/returns`; ReturnData의 orderId/type/status 검증                                                                   |
| 이미지 업로드                         | 실제 presigned 업로드                          | 320/640/1280 webp, 반품 사진은 1280. MSW 모드에서는 업로드도 목업                                                                     |

일반 UI 골격은 유지한다. 실제 API가 제공하지 않는 필드(장인 소개·별점·이미지 등)는 빈 상태/미제공으로 표시한다. 시연 데이터는 실제 상품 정보로 합치지 않는다.

## 상태와 시연 거래

네이버 데모 플래그는 탭 sessionStorage에, 실제 access token은 기존 메모리 store에 둔다. 로그아웃/인증 실패/실제 이메일 로그인 전환 때 데모 플래그를 지운다. GNB·장바구니 분기는 `useSyncExternalStore` 서버 snapshot으로 hydration을 맞춘다. 계정 전환 때 Query 캐시와 구매 preview state를 비운다. 문의·재입고·시연 찜·장바구니는 `user-N` / `demo-N` namespace를 분리한다.

MSW 구매 응답이 성공한 뒤에만 화면 상태/완료 페이지로 이동한다. 할인 결과는 MSW가 다시 계산하고 완료 화면까지 같은 금액을 사용한다. 테스트용 할인코드는 `MIDAM10`, 시연 적립금은 3,000원, 쿠폰은 2,000원이다. 새로고침으로 시연 메모리 주문이 사라질 수 있으며 실제 주문 내역에는 기록하지 않는다.

## 전체 명세 대조와 범위

- [설계 문서 104개 항목의 연결표](backend/frontend-document-coverage-2026-09-28.csv): 문서 경로, 실제 경로/메서드, 구현 여부, API 모드 소스, 미연결 사유.
- [실제 Controller 116개 경로의 연결표](backend/frontend-route-coverage-2026-09-28.csv): 문서 외 실제 경로도 포함, 백엔드 파일/라인 근거.
- [백엔드 구현 감사](backend/api-implementation-audit-2026-09-28.md), [코드 참조](backend/api-code-reference-2026-09-28.md).

현재 완료된 소비자 화면에 적용한다. 관리자/판매자/AI 제작 화면, 장인 상세·구독, 알림센터, 챗봇, 결제수단 관리, 마이페이지 대시보드/문의 내역 등 기존 자리표시자에는 새 화면을 만들지 않는다. 서버 내부 이미지 검증·생성 콜백·PG 웹훅·개발 토큰을 브라우저에 연결하지 않는다. 전체 경로 수를 화면 연결 완료 수로 표현하지 않는다.

## 검증 범위

계약 테스트는 백엔드 코드를 근거로 구성한 응답을 사용한다. 외부 실서버 OAuth·메일 발송·PG 승인은 인증 정보와 실제 서버 없이 성공 검증했다고 하지 않는다. 브라우저 계약 검증은 `node scripts/verify-api-mode.mjs`로 재실행한다(포트 9087/3101 사용). 최종 실행 명령과 결과는 PR #97에 기록한다.

### 로컬 검증 결과 (2026-09-28)

- `npm run typecheck`, `npm run lint`, `npm run build`: 통과.
- `npm run test -- --maxWorkers=3`: 195 파일, 1,151 테스트 통과.
- `npm run test:e2e -- --workers=2`: Chromium 36 통과, 실서버 전용 1 스킵.
- `node scripts/verify-api-mode.mjs`: 실제 소재 요청·실제 빈 결과·MSW 필터·네이버 시연 재접속·시연 장바구니 격리 통과. hydration 오류 및 백엔드로 향한 `/api/mock/*` 요청 0건.
