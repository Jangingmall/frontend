# 라우팅

- 원본: https://app.notion.com/p/e44ecddcc9cb8297beb201ace1430247
- 정리 기준일: 2026-09-02

## URL 설계 원칙

- 구매자 공개 영역은 루트 아래, 판매자 영역은 /seller 아래에 둔다.
- 리소스 ID가 있는 상품·장인·주문은 dynamic segment를 사용한다.
- 검색·필터·정렬·cursor처럼 새로고침·뒤로가기·공유에서 보존할 상태는 search parameter로 관리한다.
- 경로는 소문자 kebab-case, 프론트 query parameter는 camelCase를 쓴다.
- trailing slash는 사용하지 않고 대표 URL로 정규화한다.
- hash는 페이지 내 앵커만을 위해 사용한다.
- 이메일·주소·토큰·결제 정보는 URL에 넣지 않는다.

## Route Map

### 공개·구매자

| 화면            | 경로                                                                                | 접근 및 핵심 계약                            |
| --------------- | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| 홈              | /                                                                                   | 공개                                         |
| 검색            | /search?q=                                                                          | 공개                                         |
| 상품 목록       | /products                                                                           | category, sort, filter, cursor, limit        |
| 상품 상세       | /products/[slug]-[productId]                                                        | 공개, productId로 API 조회                   |
| 장인 목록       | /artisans                                                                           | stage, category, sort, cursor, limit         |
| 장인 상세       | /artisans/[slug]-[artisanId]                                                        | 공개, artisanId로 API 조회                   |
| 장바구니        | /cart                                                                               | 비회원 허용, 독립 페이지                     |
| 결제            | /checkout/[orderId]                                                                 | 로그인 필요                                  |
| 주문 완료       | /checkout/[orderId]/complete                                                        | 로그인과 본인 주문 확인 필요                 |
| 마이페이지      | /mypage                                                                             | /mypage/orders로 redirect                    |
| 주문·후기·찜    | /mypage/orders, /mypage/reviews, /mypage/favorites                                  | 로그인 필요                                  |
| 계정 관리       | /mypage/addresses, /mypage/payment-methods, /mypage/personal-info, /mypage/settings | 로그인 필요                                  |
| 로그인·회원가입 | /login, /signup                                                                     | 내부 상대 returnUrl만 허용                   |
| 고객센터        | /support                                                                            | 공개, section=faq, shipping-returns, dispute |

### 판매자

| 화면               | 경로                 | 접근 및 핵심 계약                            |
| ------------------ | -------------------- | -------------------------------------------- |
| 판매자 진입        | /seller              | 판매자 권한, /seller/products/new로 redirect |
| AI 상세페이지 제작 | /seller/products/new | 판매자 권한, 입력→생성→편집→승인·게시        |

## Dynamic Segment와 URL 상태

- 상품 상세: /products/[slug]-[productId]. slug는 표시·SEO 용도이며 API 조회 기준은 productId다.
- 장인 상세: /artisans/[slug]-[artisanId]. slug는 표시·SEO 용도이며 API 조회 기준은 artisanId다.
- 주문: /checkout/[orderId]와 완료 경로를 사용한다.
- 한글 slug를 허용한다. 현재 이름과 slug가 다르면 ID로 조회하고 현재 slug의 canonical URL로 정규화한다.
- 상품 목록 sort: popular, newest, wishlist, sales, price-asc, price-desc. 기본값은 popular다.
- 장인 목록 sort: popular, newest, most-works. 기본값은 popular다.
- 찜·최근 본 상품 탭: tab=wishlist 또는 recent. 기본값은 wishlist다.

## 인증·인가와 예외 처리

| 상황                                 | 처리                                             |
| ------------------------------------ | ------------------------------------------------ |
| 비로그인 결제·마이페이지·판매자 진입 | /login?returnUrl=...으로 이동                    |
| 로그인한 비판매자 판매자 경로 진입   | 403 권한 안내                                    |
| 로그인·회원가입 완료                 | 검증된 내부 returnUrl 또는 /mypage로 이동        |
| 로그아웃                             | 인증 필요 경로면 /, 공개 경로면 현재 페이지 유지 |
| 주문 완료 직접 접근                  | 로그인 후 returnUrl 복귀, 본인 주문만 노출       |
| 존재하지 않거나 비공개 상품          | not-found, 404                                   |
| 판매 중지 상품                       | 상세는 노출, 구매 기능은 비활성화                |
| 존재하지 않는 장인                   | not-found, 404                                   |
| 활동 중지 장인                       | 공개 유지 또는 404 정책이 아직 미정              |

## SEO와 렌더링 경계

- 전체 상품 목록과 주요 카테고리는 색인을 허용한다.
- 필터·정렬·cursor 조합 URL은 색인을 제한하고 대표 목록 또는 카테고리 URL을 canonical로 둔다.
- 공개 상품·장인 상세의 대표 URL은 최신 slug를 사용한다.
- 목록·상세의 loading은 route 수준과 component-level Suspense를 구분한다.
- 일반 REST API proxy/BFF는 만들지 않는다. POST /api/revalidate만 백엔드 콘텐츠 변경 이벤트를 처리하는 ISR webhook Route Handler다.

## 확정되지 않은 항목과 후속 설계

- 활동 중지 장인의 상세 공개 여부(R-13)는 PM 확정이 필요하다.
- 상품 목록의 wishlist·sales 정렬과 장인 목록 filter·sort는 백엔드 enum 및 프론트 API layer 매핑을 확정해야 한다.
- cursor 목록 UI를 더 보기로 할지 무한 스크롤로 할지 결정해야 한다.
- 결제·주문 완료의 세부 IA와 MVP 테스트 범위를 설계해야 한다.
- 입점 심사·판매 대시보드·정산·배송 백오피스·AI CS·선물하기·알림톡·주문제작 예약·보증서·분쟁 정책은 현재 route map 범위 밖이다.
