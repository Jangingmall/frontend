# 백엔드 API 명세·구현 대조 결과

> 확인일: 2026-09-28 · 저장소: Jangingmall/backend · 기준: `develop@48417a651476c57606ff7567ea8b204962acf9c0`
>
> 목적: 프론트엔드 연동 전에 API 문서의 계약과 실제 컨트롤러·서비스 구현을 구분한다. 이 문서는 위 커밋의 정적 코드 감사 결과이며, 운영 배포 버전이나 외부 서비스의 정상 동작을 확인한 보고서는 아니다.

## 1. 확인 결과

명세 CSV 104개 중 **99개는 메소드·경로가 코드에 대응**하고, **5개는 같은 경로가 없다**. 코드에는 CSV에 없는 매핑 **17개**가 있어 총 **116개**다. 경로가 대응하는 99개를 명세 전체 구현 완료로 해석하면 안 된다. 요청 필드, 응답 형태, 권한, 상태 전이와 서비스 처리에 차이가 있다.

| 집계                          |  수 | 기준                                                 |
| ----------------------------- | --: | ---------------------------------------------------- |
| 원본 API CSV                  | 104 | 데이터 행 수                                         |
| CSV와 코드의 메소드·경로 대응 |  99 | 경로 변수 이름은 정규화; 의미 일치는 별도 검토       |
| CSV 경로 그대로의 매핑 없음   |   5 | 이메일 2, 네이버 1, Q&A 답변 1, 알림 읽음 1          |
| CSV에 없는 코드 매핑          |  17 | 신규/변경 경로, 내부 콜백, 개발 도구 포함            |
| 실제 컨트롤러 매핑            | 116 | 컨트롤러 19개, `/api` 112 + `/internal` 2 + `/dev` 2 |

원본 CSV의 상태 값은 `예정` 89개, `백로그(MVP 제외)` 9개, `구현완료` 6개다. 실제 코드 존재 여부와 맞지 않으므로 구현 판단에 사용하지 않았다. README의 API 개수와도 차이가 있다.

- [전체 명세 대조표 CSV](./api-comparison-2026-09-28.csv): 원본 요청·응답·인증, 실제 경로·입력/반환형·처리 연결·근거를 121행으로 대조한다. 104개 원본 행 + CSV 외 17개이며, API가 121개라는 뜻은 아니다.
- [실제 API 레퍼런스](./api-code-reference-2026-09-28.md): 116개 매핑의 입력 시그니처, 접근 조건, 서비스 링크, DTO record 필드 선언.

## 2. 검토 범위와 판정 방법

1. 원본 CSV와 공통·도메인별 계약서를 읽고 기대 경로/계약을 확인했다.
2. 모든 명시적 컨트롤러 매핑을 추출하고 메소드·경로를 대조했다.
3. 컨트롤러의 DTO, SecurityConfig/메소드 인가, 서비스 호출을 추적했다. 주요 처리의 리포지토리/외부 어댑터와 도메인 상태 전이까지 확인했다.
4. 중요한 차이는 아래에 코드 근거와 함께 별도로 기록했다. 자동 추출만으로 동작 완료를 판정하지 않았다.

`경로 대응`은 라우트 존재 판정이다. `코드 처리 확인`은 저장/조회/상태 전이 로직이 존재한다는 뜻이다. `차이·보완 필요`는 계약 불일치 또는 누락된 처리다. 외부 API 정상 응답, 데이터베이스 마이그레이션 적용, 배포 설정, 실제 HTTP 직렬화까지 검증한 의미는 아니다.

검토 자료:

- [장인몰_API_명세_v1.csv](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/%EC%9E%A5%EC%9D%B8%EB%AA%B0_API_%EB%AA%85%EC%84%B8_v1.csv)
- [API_공통규칙.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/API_%EA%B3%B5%ED%86%B5%EA%B7%9C%EC%B9%99.md), [PHASE2-1_API_협업_계약서.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/PHASE2-1_API_%ED%98%91%EC%97%85_%EA%B3%84%EC%95%BD%EC%84%9C.md)
- [장인몰_API_계약서_공개조회.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/%EC%9E%A5%EC%9D%B8%EB%AA%B0_API_%EA%B3%84%EC%95%BD%EC%84%9C_%EA%B3%B5%EA%B0%9C%EC%A1%B0%ED%9A%8C.md), [주문이력_API_계약서.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/%EC%A3%BC%EB%AC%B8%EC%9D%B4%EB%A0%A5_API_%EA%B3%84%EC%95%BD%EC%84%9C.md)
- [회원_구현_현황.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/%ED%9A%8C%EC%9B%90_%EA%B5%AC%ED%98%84_%ED%98%84%ED%99%A9.md), [AI_콘텐츠생성_연동_가이드.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/AI_%EC%BD%98%ED%85%90%EC%B8%A0%EC%83%9D%EC%84%B1_%EC%97%B0%EB%8F%99_%EA%B0%80%EC%9D%B4%EB%93%9C.md), [AI_챗봇_연동_가이드.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/AI_%EC%B1%97%EB%B4%87_%EC%97%B0%EB%8F%99_%EA%B0%80%EC%9D%B4%EB%93%9C.md)
- [외부_연동_프로덕션_검증_요청.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/%EC%99%B8%EB%B6%80_%EC%97%B0%EB%8F%99_%ED%94%84%EB%A1%9C%EB%8D%95%EC%85%98_%EA%B2%80%EC%A6%9D_%EC%9A%94%EC%B2%AD.md), [documentation.gradle](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/gradle/documentation.gradle)

문서끼리도 페이지네이션·OAuth 안내가 다르다. REST Docs 기반 생성 작업이 있지만 이 체크아웃에는 생성된 `api-spec/openapi.json`이 없으며, 이번 감사에서 재생성하지 않았다. 아래 코드를 우선한 계약과 원문 명세를 구분해서 사용한다.

## 3. 동일 경로가 없는 명세 5개

| CSV 명세                                           | 실제 코드                                                      | 판정                                                             |
| -------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `POST /api/member/email-verifications`             | `POST /api/member/email/verification-code`                     | 링크 발송 계약에서 코드 발송 계약으로 변경                       |
| `GET /api/member/email-verifications/verify`       | `POST /api/member/email/verify`                                | 메소드·경로·본문 계약 변경                                       |
| `GET /api/member/oauth2/naver`                     | 대응 컨트롤러 없음                                             | 저장소 설정/identity 처리도 카카오만 지원; 네이버 구현 확인 불가 |
| `POST /api/products/questions/{questionId}/answer` | `POST /api/products/{productId}/questions/{questionId}/answer` | productId 경로 추가                                              |
| `PATCH /api/notifications/{notificationId}`        | `PATCH /api/notifications/{notificationId}/read`               | 읽음 경로 변경                                                   |

근거: [MemberController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java), [OAuthController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java), [OAuthIdentity.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/OAuthIdentity.java), [ProductController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java), [NotificationController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java). 없는 경로의 실제 응답이 반드시 404인 것은 아니다. 인가 필터가 먼저 401/403을 반환할 수 있다.

## 4. 도메인별 실제 구현 범위

| 도메인             | 매핑 수 | 실제 확인한 처리                                                                                                                 | 주요 차이/남은 검증                                                            |
| ------------------ | ------: | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 회원·장인·관리자   |      45 | 가입/로그인/refresh/logout, 프로필/주소/설정, 최근 본 상품/찜/구독, 주문·후기 조회, 판매자 신청·승인·반려·파이프라인의 저장/조회 | 이메일 인증-가입 연결 없음; 네이버 없음; 페이지 계약 상이                      |
| 상품               |      18 | 상품 CRUD/상태, 카테고리/소분류/소재, 후기·Q&A, 찜                                                                               | 공개조회 DTO/필터 일부 미지원; 공개 상세/비밀 답변/후기 자격 검증 보완 필요    |
| 결제·장바구니·반품 |      22 | 게스트/회원 장바구니와 병합, 주문·재고 예약, PG 승인/취소/웹훅 재조회, 주문 취소/배송지 변경/구매확정, 반품 저장                 | 옵션 추가금 미반영·배송비 0; 카드 등록은 billing key 아님; PG/배송 실연동 별도 |
| 상세 콘텐츠·AI     |      14 | 인터뷰 CRUD, 생성 요청/상태/콜백, 문서 조회·패치·이력, 제출/승인/반려/발행                                                       | nodeId 패치 계약; 블록 투영 동기화 누락; 자유 편집 저장 API 없음               |
| 이미지             |       3 | presign, 변형 크기·S3 객체·소유권/용도 검증, 내부 verify/consume, 미사용 삭제                                                    | WebP 변형 업로드 필요; verify는 소비 상태 변경; S3 실환경 검증 별도            |
| 알림               |       8 | 생성/목록/단건/읽음/전체 읽음/삭제/미읽음 수/SSE                                                                                 | CSV보다 경로 많음; List 응답; 일부 HTTP 상태와 envelope 불일치 가능            |
| 챗봇               |       4 | 세션/메시지 저장·소유권 확인, AI 호출, 상품 카드 조립, 세션 종료                                                                 | Public 명세와 달리 USER; AI 실패 시 대체 답변                                  |
| 개발 도구          |       2 | local 프로필 토큰/초기 데이터 도구                                                                                               | 운영 프론트엔드 연동 대상 제외                                                 |

## 5. 공통 연동 계약

### 인증과 권한

일반 인증은 `Authorization: Bearer <accessToken>`이다. refresh와 OAuth 교환에는 쿠키 계약도 있으므로 로그인·갱신 요청에서 쿠키 전달을 고려해야 한다. `USER` 권한은 ARTISAN/ADMIN에도 포함되지만 ADMIN이 ARTISAN 권한을 자동으로 얻지는 않는다. `/internal/**`는 AGENT 전용이다. 공개 URL matcher만 보고 익명 API라고 판단하지 말고 `@PreAuthorize`와 서비스 검사까지 함께 본다.

근거: [SecurityConfig.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/config/SecurityConfig.java), [MemberRole.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/domain/MemberRole.java), [MemberController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java), [OAuthController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java).

### 응답과 페이징

일반 JSON 성공 응답은 `{"success":true,"status":200,"data":...}`로 감싼다. 컨트롤러가 일반 DTO를 반환해도 ResponseAdvice가 감싼다. SSE·문자열/바이트·빈 본문은 예외다. `ResponseEntity<Void>`의 204는 JSON 파싱하지 않는다.

`Pageable` 경로는 저장소 코드 기준 **`page=0&size=20`와 Spring Page 응답**이다. 공통 계약서의 `cursor`, `limit`, 1-based `page`, `items/nextCursor/hasNext` 변환 코드는 확인하지 못했다. 주문이력 계약서 및 OpenAPI 후처리 설명은 0-based 계약을 쓰므로 문서 간에도 불일치한다. 모든 목록이 Page는 아니다. 알림/주소/챗봇 이력 등 List 반환은 별도로 처리한다.

근거: [GlobalResponseAdvice.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/GlobalResponseAdvice.java), [MemberQueryController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java), [ProductController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java), [NotificationController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java).

## 6. 문서와 코드 차이 및 보완 사항

### D01. 공통 페이지 규칙 불일치

FE의 cursor/limit 또는 1-based 변환을 그대로 쓰면 첫 페이지를 건너뛰거나 요청 크기가 반영되지 않을 수 있다. 실제 핸들러가 `Pageable`인지 먼저 확인한다. API마다 Page 응답을 FE 표준 목록 타입으로 변환하고 cursor 지원은 별도 합의한다. 근거: [API_공통규칙.md](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/docs/API_%EA%B3%B5%ED%86%B5%EA%B7%9C%EC%B9%99.md), [ProductController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L72), [MemberReadRepositoryImpl.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/infrastructure/MemberReadRepositoryImpl.java#L87).

### D02. 인증·알림·Q&A 경로와 챗봇 권한 차이

3절의 변경 경로를 사용한다. 챗봇 4개는 모두 `hasRole('USER')`이므로 게스트 챗봇으로 구현할 수 없다. 카카오는 진입→provider callback→쿠키 ticket 교환 흐름이며, 네이버 provider를 현재 코드가 지원한다고 보면 안 된다. 근거: [ChatController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatController.java), [OAuthIdentity.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/OAuthIdentity.java), [OAuthController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java).

### D03. 이메일 코드 검증 결과가 가입/로그인에 연결되지 않음

`sendCode`는 6자리 코드와 TTL을 저장해 메일을 보내고, `verify`는 저장 코드를 소비해 비교한다. 하지만 `MemberService.signUp`은 인증 완료 증빙을 확인하지 않고 ACTIVE 회원을 만든다. 로그인에도 이메일 인증 확인이 없다. 따라서 API 존재와 별개로 “인증된 이메일만 가입/로그인” 정책은 이 경로에서 강제되지 않는다. 또한 잘못된 코드로 검증해도 비교 전에 코드를 소비하므로 재발송 UX가 필요할 수 있다.

근거: [EmailVerificationService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/EmailVerificationService.java#L27), [MemberService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberService.java#L22), [Member.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/domain/Member.java#L105), [MemberAuthenticationService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAuthenticationService.java#L30).

### D04. 상품 공개조회 계약보다 DTO/필터 구현 범위가 좁음

등록 DTO는 `title`, `price`(int), `stock`, 선택적 categoryId/subcategoryId, description, thumbnailUrl, giftThemes, purposeTags, productionPeriodDays, colors, images를 받는다. 원문 계약의 모든 상세 상품/옵션/배송 필드가 구현된 것은 아니다. 목록 쿼리는 keyword/categoryId/subcategoryId/giftTheme/sort/minPrice/maxPrice/excludeSoldOut/artisanId와 Pageable이다. material/color/hasGiftWrap 필터는 이 핸들러에 없다. 저장소의 `POPULAR` 정렬은 상품 ID 내림차순이며 판매량 집계 기반이 아니다.

근거: [ProductRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductRequest.java), [ProductController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java), [ProductResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductResponse.java), [JpaProductRepository.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/infrastructure/JpaProductRepository.java#L137).

### D05. 콘텐츠 수정 API의 형태와 공개 데이터 동기화

현재 일괄 수정은 `{"patches":[{"nodeId":"...","text":"...","imageId":"..."}]}`, 단건 수정은 문자열 nodeId 경로와 `text/imageId` 본문을 사용한다. 원문 명세의 블록 순번·전체 blocks 교체와 다르다. 색상/폰트/간격/레이아웃/블록 추가·삭제·순서 변경/임의 React 문서 저장은 이 HTTP API가 받지 않는다. `ReplaceBlocks` DTO/서비스가 남아 있어도 실제 컨트롤러 호출 경로는 없다.

`bulkUpdate/updateBlock`은 reactDocument와 편집 이력을 저장하지만 `content_block` 투영을 갱신하지 않는다. 반면 상품 상세의 `detailPageBlocks`는 그 투영을 읽는다. 따라서 편집 후 공개 상세 데이터에 수정 내용이 반영되지 않을 경로가 있다. 두 패치 경로의 imageId도 단순 대입하며 `ImageService.consumeOwned` 검증/소비를 호출하지 않는다. 이미지 소유권·용도·업로드 완료 검증을 FE만으로 보장할 수 없으므로 BE 보완이 필요하다.

근거: [ContentRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentRequest.java), [ContentController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java), [ContentService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L155), [ContentService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L204), [ProductService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L240).

### D06. 생성·승인·발행은 서로 다른 상태

생성 enum은 `QUEUED/PROCESSING/ANALYZING/DRAFT_READY/COMPLETED/FAILED`의 6종이다. 가이드의 4종만 사용하면 중간 상태를 처리하지 못한다. enum에 존재한다는 사실이 모든 상태의 실행 전이를 보장하지는 않는다. 특히 스케줄러의 DRAFT_READY 처리는 상태만 바꾸므로 이 상태에서 편집할 문서가 이미 저장되었다고 가정하면 안 된다.

콘텐츠는 `DRAFT 또는 REJECTED → submit → PENDING_REVIEW → approve → APPROVED → publish → PUBLISHED`다. approve는 확인 Boolean이 false여도 null이 아니면 값을 저장하고 승인 상태로 간다. publish는 상품의 판매 상태를 변경하지 않는다. AI 승인 렌더/상품 동기화 호출에서 오류를 로그로 남기고 정상 응답하는 경로도 있어 “발행 API 성공 = AI 반영 완료”가 아니다.

근거: [GenerationStatus.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/domain/GenerationStatus.java), [GenerationDeadlineScheduler.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/GenerationDeadlineScheduler.java#L52), [Content.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/domain/Content.java#L95), [ContentService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L501).

### D07. 주문·결제는 처리 코드가 있지만 옵션·배송·카드 등록 범위가 제한됨

주문은 본인 배송지/장바구니 조회, 재고 예약, 선택적 Idempotency-Key 중복 처리를 수행한다. 승인/취소는 PaymentGateway와 연결되고 웹훅은 PG 재조회 결과를 검증한다. 하지만 현재 `JdbcCheckoutCatalog`는 옵션 선택을 인자로 받아도 옵션 유효성/추가금 계산에 사용하지 않고 상품 기본 가격으로 견적을 낸다. 배송비는 0이며 판매량 반영은 명시적 no-op다.

저장 결제수단 등록은 카드 형식 검증 후 마스킹/지문 정보를 저장한다. PG billing key 발급 및 그 키로 자동 결제하는 구현은 이 서비스에 없다. 반품 API는 본인 주문/상품, 상태, 7일 제한(DELIVERED), 사유/사진 등을 확인하고 신청을 저장한다. 반품 신청 응답을 실제 PG 환불 완료로 취급하면 안 된다. 배송 조회는 외부 게이트웨이가 있지만 `registerDispatch`를 호출할 판매자 HTTP 엔드포인트는 현재 컨트롤러 목록에서 확인되지 않는다.

근거: [PaymentService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java), [JdbcCheckoutCatalog.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/infrastructure/JdbcCheckoutCatalog.java#L33), [JdbcCheckoutCatalog.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/infrastructure/JdbcCheckoutCatalog.java#L125), [PaymentProfileService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java#L36), [ReturnService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/ReturnService.java#L41), [DeliveryService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/DeliveryService.java#L51).

### D08. HTTP 상태·CORS 계약 확인 필요

알림 읽음/전체 읽음/삭제, 챗봇 종료, 상품 상태 변경/삭제/찜 추가·해제는 `ApiResponse.noContent()`를 반환하지만 해당 메소드가 HTTP 204를 설정하지 않는다. 이 factory는 JSON의 status=204만 만든다. 코드상 기본 HTTP 200 + 본문 status=204가 될 수 있으므로 실제 응답 검증이 필요하다. 모든 noContent factory 사용을 빈 본문 HTTP 204로 가정하지 않는다.

CORS 허용 헤더는 Authorization, Content-Type, X-Requested-With이며 주문 생성의 `Idempotency-Key`가 없다. 다른 origin에서 해당 헤더를 보내면 preflight가 차단될 수 있다. FE와 API가 같은 origin의 프록시를 통하면 이 CORS 조건은 적용되지 않는다.

근거: [ApiResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java#L17), [NotificationController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java), [ChatController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatController.java), [SecurityConfig.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/config/SecurityConfig.java#L114).

### D09. Q&A·후기 처리의 정책 검증 누락

비밀 질문 조회는 질문 본문을 viewer에 따라 마스킹하지만 같은 응답의 `answer`는 viewer 확인 없이 변환한다. 답변이 있는 비밀 질문에서 답변 내용이 노출되는 코드 경로다. 후기 작성 서비스는 상품 존재/중복 orderItemId/이미지는 검사하지만 주문상품이 현재 회원 소유인지, 해당 상품과 일치하는지, 후기 작성 가능한 주문 상태인지를 확인하지 않는다. 공개 전 해당 정책 검증을 보완하고 테스트해야 한다.

근거: [ProductQnaResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaResponse.java#L20), [ProductReviewService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductReviewService.java#L54).

### D10. 공개 상품 상세의 상태 필터 부재

공개 `GET /api/products/{productId}`는 ID로 상품을 읽고 응답을 만든다. 목록처럼 ON_SALE/SOLD_OUT으로 제한하지 않으며, contentBlocks 조회에도 콘텐츠 PUBLISHED 조건이 없다. 따라서 미판매/미발행 자료를 숨기는 정책이 공개 상세 코드에서 강제되지 않는다. “발행 전에는 URL로도 비공개”를 전제로 FE를 구현해서는 안 된다.

근거: [ProductService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L124), [ProductService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L199), [ProductService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L240), [SecurityConfig.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/config/SecurityConfig.java#L81).

## 7. 판매자 상세페이지 연동에 사용할 계약

| 단계                | 실제 호출/입력                                                                 | 결과와 주의                                                              |
| ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 상품 초안           | `POST /api/products`                                                           | 최소 title/price/stock; DRAFT 상품 생성, ARTISAN 필요                    |
| 이미지 준비         | `POST /api/images/presigned-url` 후 반환 URL로 PUT                             | JSON 파일 업로드 API 아님; WebP 변형과 purpose 계약 확인                 |
| 인터뷰              | `POST/GET/PATCH /api/content/products/{productId}/interview`                   | 실제 필드는 레퍼런스 InterviewRequest 참고                               |
| 생성 요청           | `POST /api/content/products/{productId}/generations`                           | images 1~8개, productName 15자 이내, howMade/careTips 필수; HTTP 202     |
| 상태 조회           | `GET /api/content/products/{productId}/generations/{generationId}`             | 6종 상태 처리; callback 완료/문서 조회도 구분                            |
| 생성 문서           | `GET /api/content/products/{productId}/contents`                               | reactDocument와 blocks를 동일한 최신 데이터로 가정하지 않음              |
| 텍스트/이미지 패치  | `PATCH /api/content/products/{productId}/contents/{contentId}`                 | patches 배열; DRAFT/REJECTED에서만 수정; D05 보완 필요                   |
| 단건 패치           | `PATCH /api/content/products/{productId}/contents/{contentId}/blocks/{nodeId}` | blockOrder 숫자 대신 문서의 nodeId                                       |
| 검토 제출/승인/반려 | `POST .../contents/{contentId}/submit`, `/approve`, `/reject`                  | approve 본문 factCheckConfirmed/photoMatchConfirmed/displayApprovalBadge |
| 발행                | `POST /api/content/products/{productId}/publish`                               | APPROVED 필요; 상품 판매 상태 별도                                       |

생성 요청 예시(값은 설명용이며 실제 발급된 이미지 참조를 사용):

```json
{
  "images": ["<업로드한 이미지 참조>"],
  "productName": "백자 찻잔",
  "howMade": "물레로 성형하고 유약을 입혀 구웠습니다.",
  "careTips": "부드러운 수세미로 세척해 주세요."
}
```

텍스트 수정 예시:

```json
{
  "patches": [{ "nodeId": "<실제 문서 노드 ID>", "text": "수정한 작품 설명" }]
}
```

자유 스타일·레이아웃·순서 편집을 Figma/참고 구현처럼 영구 저장하려면 별도 BE 계약이 필요하다. 우선 적용 가능한 UI도 D05의 공개 데이터 동기화와 이미지 검증 보완을 완료한 뒤 통합 검증한다.

## 8. 검증 수준과 후속 확인

- 완료: 원본 104행/실제 116개 매핑/99개 대응/5개 경로 부재/17개 추가 경로의 개수와 유일성 대조, 코드 근거 링크 대상 및 줄 번호 확인.
- 완료: 주요 도메인의 컨트롤러→서비스→저장소/외부 어댑터 연결과 위 D01~D10 항목의 정적 확인.
- 미실행: 백엔드 Gradle 테스트 및 REST Docs/OpenAPI 재생성. 프로젝트는 Java 25 toolchain을 요구하고 현재 PATH의 Java는 8이므로 이 환경에서 테스트 통과를 주장하지 않는다.
- 미실행: 운영/스테이징 HTTP 호출, PostgreSQL/Redis/S3/SMTP/카카오/Toss/배송/AI 서버 통합 검증. 운영 사용자 데이터나 결제를 생성하지 않았다.

BE 후속 검증은 우선 D05/D09/D10의 데이터·접근 정책을 수정한 뒤 진행한다. 이후 이메일 인증 결과 강제, 옵션 가격·배송비, CORS/HTTP 상태 계약을 확정하고, 실제 HTTP 응답으로 FE DTO를 고정한다. AI는 생성→DRAFT_READY→문서 수신→검토→완료/발행 전체 흐름과 실패/재시도까지 확인해야 한다.

향후 업데이트할 때는 먼저 backend 커밋을 새로 고정하고 이 문서의 개수·상태·코드 링크를 함께 갱신한다. 이후 backend 변경 사항은 이 스냅샷에 자동 반영되지 않는다.
