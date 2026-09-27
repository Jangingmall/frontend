# 백엔드 API 코드 기준 레퍼런스

> 확인일: 2026-09-28 · backend `develop@48417a651476c57606ff7567ea8b204962acf9c0`
> [감사 요약](./api-implementation-audit-2026-09-28.md) · [원본 명세와 전체 대조 CSV](./api-comparison-2026-09-28.csv)

## 읽는 법

실제 Java 컨트롤러 매핑 116개를 수록한다. 자동 추출한 시그니처에서 `@RequestBody`는 JSON 본문, `@RequestParam`은 쿼리, `@RequestPart`는 multipart, `@CookieValue`는 쿠키, `@RequestHeader`는 헤더다. `@AuthenticationPrincipal`은 서버가 JWT에서 얻는 값이며 클라이언트가 본문에 넣는 필드가 아니다. `HttpServletRequest/Response`도 전송 필드가 아니다.
반환형은 Java 선언이며 최종 wire JSON은 `GlobalResponseAdvice`의 공통 envelope 적용을 함께 본다. 요청·응답 모델의 필드와 검증 annotation은 각 DTO 링크 및 문서 끝의 record 선언에 수록한다. 선언만으로 서비스의 모든 비즈니스 검증이나 HTTP 오류를 설명하지 않으므로 처리 코드 링크를 병기한다. `Map` 응답은 해당 조회 서비스/리포지토리에서 구성된다.
경로 대응은 메소드와 경로 템플릿의 대응만 의미한다. 변수 이름을 정규화해 대조했으므로 `{blockOrder}`와 `{nodeId}`도 대응으로 집계되지만 의미는 다르다. 본 문서는 테스트 통과나 배포 서버 동작을 보증하지 않는다.
프레임워크 제공 OAuth 시작·콜백, Actuator, 문서 정적 리소스, CORS preflight는 116개 집계에서 제외했다. `/internal` 2개와 `/dev` 2개는 포함했다.

## 도메인별 경로 수

| 코드 패키지  | 매핑 수 |
| ------------ | ------: |
| chatbot      |       4 |
| content      |      14 |
| global       |       2 |
| image        |       3 |
| member       |      45 |
| notification |       8 |
| payment      |      22 |
| product      |      18 |

## chatbot

### `POST /api/chatbot/sessions`

- 기능: 챗봇 세션 생성
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [ChatController.java:30](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatController.java#L30)
- 처리 연결: [ChatService.createSession](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatService.java#L42)
- 주의: CSV Public과 달리 USER 필요; AI 장애 대체 응답 가능

```java
public ResponseEntity<ApiResponse<ChatResponse.SessionView>> createSession(
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ChatResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatResponse.java)

### `POST /api/chatbot/sessions/{sessionId}/messages`

- 기능: 챗봇 메시지 전송
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [ChatController.java:39](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatController.java#L39)
- 처리 연결: [ChatService.sendMessage](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatService.java#L47)
- 주의: CSV Public과 달리 USER 필요; AI 장애 대체 응답 가능

```java
public ResponseEntity<ApiResponse<ChatResponse.SendResult>> sendMessage(
        @AuthenticationPrincipal Long memberId,
        @PathVariable UUID sessionId,
        @Valid @RequestBody ChatRequest.SendMessage request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ChatRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatRequest.java), [ChatResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatResponse.java)

### `GET /api/chatbot/sessions/{sessionId}/messages`

- 기능: 챗봇 대화 히스토리 조회
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ChatController.java:52](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatController.java#L52)
- 처리 연결: [ChatService.findMessages](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatService.java#L76)
- 주의: CSV Public과 달리 USER 필요; AI 장애 대체 응답 가능

```java
public ApiResponse<List<ChatResponse.MessageView>> messages(
        @AuthenticationPrincipal Long memberId,
        @PathVariable UUID sessionId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ChatResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatResponse.java)

### `DELETE /api/chatbot/sessions/{sessionId}`

- 기능: 챗봇 세션 종료
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 경로 대응
- 구현: [ChatController.java:61](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatController.java#L61)
- 처리 연결: [ChatService.endSession](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatService.java#L86)
- 주의: CSV Public과 달리 USER 필요; AI 장애 대체 응답 가능; 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> endSession(
        @AuthenticationPrincipal Long memberId,
        @PathVariable UUID sessionId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

## content

### `POST /internal/generations/{generationId}/completion`

- 기능: completeMultipart
- 접근 조건: `AGENT (내부 인증 필터)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [AiCallbackController.java:33](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/AiCallbackController.java#L33)
- 처리 연결: [GenerationService.completeWithImages](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/GenerationService.java#L72)
- 주의: CSV에 없는 실제 경로; 생성 상태 6종; 실제 AI 완료/콜백은 런타임 검증 필요

```java
public ResponseEntity<ApiResponse<BeToAiPersistAckResponse>> completeMultipart(
        @PathVariable Long generationId,
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @RequestPart("metadata") String metadataJson,
        @RequestPart(value = "detail_page_image", required = false) MultipartFile detailPageImage,
        HttpServletRequest rawRequest
    ) throws Exception
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [BeToAiPersistAckResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/BeToAiPersistAckResponse.java)

### `GET /api/content/products/{productId}/contents`

- 기능: 생성 결과 조회
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ContentController.java:28](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L28)
- 처리 연결: [ContentService.getContent](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L106)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<ContentResponse.Detail> getContent(
        @PathVariable Long productId,
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `GET /api/content/products/{productId}/contents/versions`

- 기능: 콘텐츠 버전 조회
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ContentController.java:37](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L37)
- 처리 연결: [ContentService.getVersionHistory](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L114)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<List<ContentResponse.VersionHistory>> getVersionHistory(
        @PathVariable Long productId,
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `POST /api/content/products/{productId}/contents/{contentId}/submit`

- 기능: submitForReview
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [ContentController.java:46](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L46)
- 처리 연결: [ContentService.submitForReview](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L457)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<ContentResponse.StatusChanged> submitForReview(
        @PathVariable Long productId,
        @PathVariable Long contentId,
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `POST /api/content/products/{productId}/contents/{contentId}/approve`

- 기능: 콘텐츠 승인
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ContentController.java:57](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L57)
- 처리 연결: [ContentService.approve](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L466)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<ContentResponse.StatusChanged> approve(
        @PathVariable Long productId,
        @PathVariable Long contentId,
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody ContentRequest.Approve request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentRequest.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `POST /api/content/products/{productId}/contents/{contentId}/reject`

- 기능: 콘텐츠 반려
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ContentController.java:72](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L72)
- 처리 연결: [ContentService.reject](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L492)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<ContentResponse.StatusChanged> reject(
        @PathVariable Long productId,
        @PathVariable Long contentId,
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `PATCH /api/content/products/{productId}/contents/{contentId}`

- 기능: 문단 일괄 수정
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ContentController.java:83](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L83)
- 처리 연결: [ContentService.bulkUpdate](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L155)
- 주의: nodeId 기반 text/imageId 패치만; 블록 투영 갱신 없음 (D05)

```java
public ApiResponse<ContentResponse.BulkUpdated> bulkUpdate(
        @PathVariable Long productId,
        @PathVariable Long contentId,
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody ContentRequest.BulkUpdate request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentRequest.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `PATCH /api/content/products/{productId}/contents/{contentId}/blocks/{nodeId}`

- 기능: 단건 블록 수정
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ContentController.java:98](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L98)
- 처리 연결: [ContentService.updateBlock](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L182)
- 주의: nodeId 기반 text/imageId 패치만; 블록 투영 갱신 없음 (D05)

```java
public ApiResponse<ContentResponse.BlockUpdated> updateBlock(
        @PathVariable Long productId,
        @PathVariable Long contentId,
        @PathVariable String nodeId,
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody ContentRequest.BlockUpdate request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentRequest.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `POST /api/content/products/{productId}/publish`

- 기능: 상품 게시
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ContentController.java:112](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentController.java#L112)
- 처리 연결: [ContentService.publish](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentService.java#L501)
- 주의: 콘텐츠 PUBLISHED 전이; 상품 판매 상태 별도

```java
public ApiResponse<ContentResponse.StatusChanged> publish(
        @PathVariable Long productId,
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ContentResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

### `POST /api/content/products/{productId}/generations`

- 기능: AI 상세페이지 생성 요청
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 202
- 원본 CSV: 경로 대응
- 구현: [GenerationController.java:26](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/GenerationController.java#L26)
- 처리 연결: [GenerationService.request](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/GenerationService.java#L39)
- 주의: 생성 상태 6종; 실제 AI 완료/콜백은 런타임 검증 필요

```java
public ResponseEntity<ApiResponse<GenerationResponse>> request(
        @PathVariable Long productId,
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody GenerationRequest.Create request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [GenerationRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/GenerationRequest.java), [GenerationResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/GenerationResponse.java)

### `GET /api/content/products/{productId}/generations/{generationId}`

- 기능: AI 생성 상태 조회
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [GenerationController.java:44](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/GenerationController.java#L44)
- 처리 연결: [GenerationService.poll](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/GenerationService.java#L102)
- 주의: 생성 상태 6종; 실제 AI 완료/콜백은 런타임 검증 필요

```java
public ApiResponse<GenerationResponse> poll(
        @PathVariable Long productId,
        @PathVariable Long generationId,
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [GenerationResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/GenerationResponse.java)

### `POST /api/content/products/{productId}/interview`

- 기능: 취재 데이터 등록
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [InterviewController.java:27](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/InterviewController.java#L27)
- 처리 연결: [InterviewService.create](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/InterviewService.java#L24)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<InterviewResponse>> create(
        @PathVariable Long productId,
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody InterviewRequest.Create request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [InterviewRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/InterviewRequest.java), [InterviewResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/InterviewResponse.java)

### `GET /api/content/products/{productId}/interview`

- 기능: 취재 데이터 조회
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [InterviewController.java:45](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/InterviewController.java#L45)
- 처리 연결: [InterviewService.find](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/InterviewService.java#L41)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<InterviewResponse> find(
        @PathVariable Long productId,
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [InterviewResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/InterviewResponse.java)

### `PATCH /api/content/products/{productId}/interview`

- 기능: 취재 데이터 수정
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [InterviewController.java:54](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/InterviewController.java#L54)
- 처리 연결: [InterviewService.update](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/InterviewService.java#L50)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<InterviewResponse> update(
        @PathVariable Long productId,
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody InterviewRequest.Update request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [InterviewRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/InterviewRequest.java), [InterviewResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/InterviewResponse.java)

## global

### `POST /dev/token`

- 기능: token
- 접근 조건: `local 프로필 전용`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [DevAuthController.java:35](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/dev/DevAuthController.java#L35)
- 처리 연결: [JwtTokenProvider.createAccessToken](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/security/JwtTokenProvider.java#L26)
- 주의: CSV에 없는 실제 경로; 운영 FE에서 호출하지 않음

```java
public ApiResponse<DevTokenResponse> token(
        @RequestParam(defaultValue = "ARTISAN") String role,
        @RequestParam(required = false) Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [DevTokenResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/dev/DevAuthController.java#L119)

### `POST /dev/setup`

- 기능: setup
- 접근 조건: `local 프로필 전용`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [DevAuthController.java:49](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/dev/DevAuthController.java#L49)
- 처리 연결: [JwtTokenProvider.createAccessToken](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/security/JwtTokenProvider.java#L26)
- 주의: CSV에 없는 실제 경로; 운영 FE에서 호출하지 않음

```java
public ApiResponse<DevSetupResponse> setup()
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [DevSetupResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/dev/DevAuthController.java#L121)

## image

### `POST /api/images/presigned-url`

- 기능: 이미지 업로드 Presigned URL 발급(다중 variant)
- 접근 조건: `USER / ARTISAN / AGENT`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ImageController.java:34](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/presentation/ImageController.java#L34)
- 처리 연결: [ImageService.createPresignedUpload](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/application/ImageService.java#L46)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<ImageService.PresignedUpload> createPresignedUrl(
        @AuthenticationPrincipal Long memberId,
        Authentication authentication,
        @Valid @RequestBody PresignedUrlRequest request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ImageService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/application/ImageService.java), [PresignedUrlRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/presentation/ImageController.java#L60)

### `DELETE /api/images/{imageId}`

- 기능: 미사용 이미지 삭제
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ImageController.java:48](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/presentation/ImageController.java#L48)
- 처리 연결: [ImageService.deleteUnused](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/application/ImageService.java#L230)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> deleteUnused(@AuthenticationPrincipal Long memberId, @PathVariable String imageId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `POST /internal/images/verify`

- 기능: 이미지 소유권/존재 검증(내부 전용)
- 접근 조건: `hasRole('AGENT')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ImageController.java:54](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/presentation/ImageController.java#L54)
- 처리 연결: [ImageService.verifyAndConsume](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/application/ImageService.java#L72)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<ImageService.Verification> verify(@Valid @RequestBody VerifyImageRequest request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ImageService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/application/ImageService.java), [VerifyImageRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/presentation/ImageController.java#L114)

## member

### `GET /api/member/me/addresses`

- 기능: 배송지 목록 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [AddressController.java:20](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/AddressController.java#L20)
- 처리 연결: [AddressService.list](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressService.java#L19)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public List<AddressData> list(@AuthenticationPrincipal Long memberId)
```

요청·반환 모델: [AddressData](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressData.java)

### `POST /api/member/me/addresses`

- 기능: 배송지 등록
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [AddressController.java:25](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/AddressController.java#L25)
- 처리 연결: [AddressService.create](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressService.java#L25)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<AddressData> create(@AuthenticationPrincipal Long memberId,
                                              @Valid @RequestBody MemberAccountRequests.CreateAddress request)
```

요청·반환 모델: [AddressData](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressData.java), [MemberAccountRequests](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberAccountRequests.java)

### `PATCH /api/member/me/addresses/{addressId}`

- 기능: 배송지 수정
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [AddressController.java:31](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/AddressController.java#L31)
- 처리 연결: [AddressService.update](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressService.java#L36)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public AddressData update(@AuthenticationPrincipal Long memberId, @PathVariable Long addressId,
                              @Valid @RequestBody MemberAccountRequests.UpdateAddress request)
```

요청·반환 모델: [AddressData](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressData.java), [MemberAccountRequests](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberAccountRequests.java)

### `DELETE /api/member/me/addresses/{addressId}`

- 기능: 배송지 삭제
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [AddressController.java:37](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/AddressController.java#L37)
- 처리 연결: [AddressService.delete](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressService.java#L45)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> delete(@AuthenticationPrincipal Long memberId, @PathVariable Long addressId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/artisans`

- 기능: 장인 목록 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ArtisanController.java:18](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/ArtisanController.java#L18)
- 처리 연결: [ArtisanService.list](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/ArtisanService.java#L54)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public Page<Map<String, Object>> list(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String certificationLevel,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String initial,
            @RequestParam(defaultValue = "POPULAR") String sort)
```

### `GET /api/member/artisans/{artisanId}`

- 기능: 장인 정보 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ArtisanController.java:28](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/ArtisanController.java#L28)
- 처리 연결: [ArtisanService.detail](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/ArtisanService.java#L43)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public Map<String, Object> detail(@PathVariable Long artisanId)
```

### `GET /api/member/artisans/me`

- 기능: 내 장인 정보 조회
- 접근 조건: `ARTISAN (서비스 검사)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ArtisanController.java:33](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/ArtisanController.java#L33)
- 처리 연결: [ArtisanService.mine](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/ArtisanService.java#L48)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public Map<String, Object> mine(@AuthenticationPrincipal Long memberId)
```

### `PATCH /api/member/artisans/me`

- 기능: 장인 정보 수정
- 접근 조건: `ARTISAN (서비스 검사)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ArtisanController.java:38](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/ArtisanController.java#L38)
- 처리 연결: [ArtisanService.update](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/ArtisanService.java#L59)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public Map<String, Object> update(@AuthenticationPrincipal Long memberId, @Valid @RequestBody Profile request)
```

요청·반환 모델: [Profile](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/ArtisanController.java#L43)

### `PATCH /api/member/me`

- 기능: 내 정보 수정
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberAccountController.java:19](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberAccountController.java#L19)
- 처리 연결: [MemberAccountService.update](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAccountService.java#L21)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public MemberProfileResponse update(@AuthenticationPrincipal Long memberId,
                                        @Valid @RequestBody MemberAccountRequests.Profile request)
```

요청·반환 모델: [MemberAccountRequests](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberAccountRequests.java), [MemberProfileResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberProfileResponse.java)

### `PATCH /api/member/me/password`

- 기능: 비밀번호 변경
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberAccountController.java:26](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberAccountController.java#L26)
- 처리 연결: [MemberAccountService.changePassword](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAccountService.java#L31)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> changePassword(@AuthenticationPrincipal Long memberId,
                                           @Valid @RequestBody MemberAccountRequests.Password request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [MemberAccountRequests](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberAccountRequests.java)

### `DELETE /api/member/me`

- 기능: 회원 탈퇴
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberAccountController.java:33](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberAccountController.java#L33)
- 처리 연결: [MemberAccountService.withdraw](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAccountService.java#L41)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> withdraw(@AuthenticationPrincipal Long memberId,
                                     @Valid @RequestBody MemberAccountRequests.Withdrawal request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [MemberAccountRequests](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberAccountRequests.java)

### `GET /api/member/settings`

- 기능: 환경설정 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:16](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L16)
- 처리 연결: [MemberActivityService.settings](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L21)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public MemberActivityService.Settings settings(@AuthenticationPrincipal Long memberId)
```

요청·반환 모델: [Settings](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L76)

### `PATCH /api/member/settings`

- 기능: 환경설정 수정
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:21](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L21)
- 처리 연결: [MemberActivityService.updateSettings](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L27)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public MemberActivityService.Settings updateSettings(@AuthenticationPrincipal Long memberId, @Valid @RequestBody Settings request)
```

요청·반환 모델: [Settings](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L76)

### `POST /api/member/recent-views`

- 기능: 최근 본 상품 기록
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:26](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L26)
- 처리 연결: [MemberActivityService.recordView](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L36)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> record(@AuthenticationPrincipal Long memberId, @Valid @RequestBody RecentView request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [RecentView](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L77)

### `POST /api/member/recent-views/merge`

- 기능: 최근 본 작품 병합
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:32](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L32)
- 처리 연결: [MemberActivityService.mergeViews](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L43)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> merge(@AuthenticationPrincipal Long memberId, @Valid @RequestBody RecentViews request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [RecentViews](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L78)

### `DELETE /api/member/recent-views`

- 기능: 최근 본 작품 전체 삭제
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:38](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L38)
- 처리 연결: [MemberActivityService.clearViews](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L53)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> clear(@AuthenticationPrincipal Long memberId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/recent-views`

- 기능: 최근 본 상품 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:44](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L44)
- 처리 연결: [MemberActivityService.recentViews](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L59)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public org.springframework.data.domain.Page<Map<String, Object>> recent(
            @AuthenticationPrincipal Long memberId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable)
```

### `POST /api/member/artisans/{artisanId}/subscribe`

- 기능: 장인 신작 알림 구독
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:51](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L51)
- 처리 연결: [MemberActivityService.subscribe](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L78)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> subscribe(@AuthenticationPrincipal Long memberId, @PathVariable Long artisanId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `DELETE /api/member/artisans/{artisanId}/subscribe`

- 기능: 장인 신작 알림 구독 취소
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:57](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L57)
- 처리 연결: [MemberActivityService.unsubscribe](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L85)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> unsubscribe(@AuthenticationPrincipal Long memberId, @PathVariable Long artisanId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/artisans/subscriptions`

- 기능: 관심 장인(구독) 목록 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:63](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L63)
- 처리 연결: [MemberActivityService.subscriptions](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L97)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public org.springframework.data.domain.Page<Map<String, Object>> subscriptions(
            @AuthenticationPrincipal Long memberId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable)
```

### `PATCH /api/member/artisans/subscriptions/notifications`

- 기능: 관심 장인 전체 알림 일괄 켜기/끄기
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberActivityController.java:70](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L70)
- 처리 연결: [MemberActivityService.notifications](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L91)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> notifications(@AuthenticationPrincipal Long memberId, @Valid @RequestBody Notifications request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [Notifications](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java#L79)

### `POST /api/member/email/verification-code`

- 기능: sendVerificationCode
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [MemberController.java:40](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java#L40)
- 처리 연결: [EmailVerificationService.sendCode](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/EmailVerificationService.java#L20)
- 주의: CSV에 없는 실제 경로; 이메일 코드 검증과 가입 상태가 연결되지 않음 (감사 문서 D03)

```java
public ResponseEntity<ApiResponse<Void>> sendVerificationCode(
        @Valid @RequestBody EmailVerificationRequest.Send request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [EmailVerificationRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/EmailVerificationRequest.java)

### `POST /api/member/email/verify`

- 기능: verifyEmail
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [MemberController.java:48](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java#L48)
- 처리 연결: [EmailVerificationService.verify](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/EmailVerificationService.java#L27)
- 주의: CSV에 없는 실제 경로; 이메일 코드 검증과 가입 상태가 연결되지 않음 (감사 문서 D03)

```java
public ResponseEntity<ApiResponse<Void>> verifyEmail(
        @Valid @RequestBody EmailVerificationRequest.Verify request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [EmailVerificationRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/EmailVerificationRequest.java)

### `POST /api/member/signup`

- 기능: 이메일 회원가입
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [MemberController.java:56](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java#L56)
- 처리 연결: [MemberService.signUp](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberService.java#L22)
- 주의: 이메일 코드 검증과 가입 상태가 연결되지 않음 (감사 문서 D03)

```java
public ResponseEntity<ApiResponse<MemberSignupResponse>> signUp(
        @Valid @RequestBody MemberSignupRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [MemberSignupRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberSignupRequest.java), [MemberSignupResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberSignupResponse.java)

### `POST /api/member/login`

- 기능: 로그인
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberController.java:64](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java#L64)
- 처리 연결: [MemberAuthenticationService.login](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAuthenticationService.java#L30)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<MemberLoginResponse>> login(
        @Valid @RequestBody MemberLoginRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [MemberLoginRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberLoginRequest.java), [MemberLoginResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberLoginResponse.java)

### `POST /api/member/token/refresh`

- 기능: 액세스 토큰 재발급
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberController.java:74](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java#L74)
- 처리 연결: [MemberAuthenticationService.refresh](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAuthenticationService.java#L54)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<MemberTokenRefreshResponse>> refresh(
        @CookieValue(value = "refreshToken", required = false) String refreshToken
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [MemberTokenRefreshResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberTokenRefreshResponse.java)

### `POST /api/member/logout`

- 기능: 로그아웃
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberController.java:87](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java#L87)
- 처리 연결: [MemberAuthenticationService.logout](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAuthenticationService.java#L76)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal Long memberId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/me`

- 기능: 내 정보 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberController.java:95](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberController.java#L95)
- 처리 연결: [MemberAuthenticationService.getProfile](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAuthenticationService.java#L81)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<MemberProfileResponse> getMe(@AuthenticationPrincipal Long memberId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [MemberProfileResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberProfileResponse.java)

### `GET /api/member/me/wishes`

- 기능: 찜 목록 조회
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberQueryController.java:27](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java#L27)
- 처리 연결: [MemberQueryService.wishes](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberQueryService.java#L21)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public ApiResponse<Page<Map<String, Object>>> wishes(
        @AuthenticationPrincipal Long memberId,
        @PageableDefault(size = 20) Pageable pageable
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/me/wishes/{productId}`

- 기능: isWished
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 204 찜 존재 / 404 미존재, 빈 본문
- 원본 CSV: 미기재
- 구현: [MemberQueryController.java:36](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java#L36)
- 처리 연결: [MemberQueryService.isWished](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberQueryService.java#L52)
- 주의: CSV에 없는 실제 경로

```java
public ResponseEntity<Void> isWished(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId
    )
```

### `GET /api/member/me/orders/summary`

- 기능: orderSummary
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [MemberQueryController.java:47](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java#L47)
- 처리 연결: [MemberQueryService.orderCountSummary](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberQueryService.java#L40)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<Map<String, Object>> orderSummary(
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/me/orders`

- 기능: 주문 목록 조회
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberQueryController.java:55](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java#L55)
- 처리 연결: [MemberQueryService.orders](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberQueryService.java#L27)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public ApiResponse<Page<Map<String, Object>>> orders(
        @AuthenticationPrincipal Long memberId,
        @PageableDefault(size = 20) Pageable pageable,
        @RequestParam(defaultValue = "ALL") List<String> status,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to,
        @RequestParam(required = false) String artisanName
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/me/orders/{orderId}`

- 기능: 주문 상세 조회
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberQueryController.java:69](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java#L69)
- 처리 연결: [MemberQueryService.order](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberQueryService.java#L34)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Map<String, Object>> order(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long orderId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/me/reviews`

- 기능: 내 후기 조회
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberQueryController.java:78](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java#L78)
- 처리 연결: [MemberQueryService.reviews](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberQueryService.java#L46)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public ApiResponse<Page<Map<String, Object>>> reviews(
        @AuthenticationPrincipal Long memberId,
        @PageableDefault(size = 20) Pageable pageable
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/me/reviews/writable`

- 기능: 작성 가능 후기 조회
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [MemberQueryController.java:87](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberQueryController.java#L87)
- 처리 연결: [MemberQueryService.reviews](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberQueryService.java#L46)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public ApiResponse<Page<Map<String, Object>>> writable(
        @AuthenticationPrincipal Long memberId,
        @PageableDefault(size = 20) Pageable pageable
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/member/oauth2/kakao`

- 기능: 카카오 로그인
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 302
- 원본 CSV: 경로 대응
- 구현: [OAuthController.java:23](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java#L23)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<Void> kakao()
```

### `POST /api/member/oauth2/exchange`

- 기능: OAuth 결과 교환
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [OAuthController.java:28](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java#L28)
- 처리 연결: [OAuthMemberService.exchange](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/OAuthMemberService.java#L32), [OAuthMemberService.onboarding](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/OAuthMemberService.java#L36), [MemberAuthenticationService.socialSession](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAuthenticationService.java#L97)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ExchangeResponse> exchange(@CookieValue(value="oauthTicket",required=false) String ticket)
```

요청·반환 모델: [ExchangeResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java#L53)

### `POST /api/member/oauth2/complete-profile`

- 기능: SNS 회원가입 추가정보 입력
- 접근 조건: `Public; 쿠키/본문 조건 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [OAuthController.java:42](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java#L42)
- 처리 연결: [OAuthMemberService.complete](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/OAuthMemberService.java#L41), [MemberAuthenticationService.socialSession](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberAuthenticationService.java#L97)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<CompletionResponse> complete(@CookieValue(value="oauthOnboarding",required=false) String token,
                                                       @Valid @RequestBody CompleteProfile request)
```

요청·반환 모델: [CompleteProfile](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java#L55), [CompletionResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java#L54)

### `POST /api/member/artisans/applications`

- 기능: 장인 가입 신청
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [SellerApplicationController.java:17](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L17)
- 처리 연결: [SellerApplicationService.apply](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/SellerApplicationService.java#L21)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<SellerApplicationData> apply(@AuthenticationPrincipal Long memberId,
                                                      @Valid @RequestBody ApplicationRequest request)
```

요청·반환 모델: [ApplicationRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L59)

### `GET /api/member/artisans/applications/me`

- 기능: 내 장인 입점 신청 상태 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [SellerApplicationController.java:24](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L24)
- 처리 연결: [SellerApplicationService.mine](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/SellerApplicationService.java#L30)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public SellerApplicationData mine(@AuthenticationPrincipal Long memberId)
```

### `GET /api/admin/seller-applications`

- 기능: 장인 가입 신청 조회
- 접근 조건: `ADMIN (서비스 검사)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [SellerApplicationController.java:29](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L29)
- 처리 연결: [SellerApplicationService.list](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/SellerApplicationService.java#L37)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public org.springframework.data.domain.Page<SellerApplicationData> list(
            @AuthenticationPrincipal Long memberId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable,
            @RequestParam(required = false) String status)
```

### `GET /api/admin/seller-applications/{applicationId}`

- 기능: 장인 가입 신청 상세
- 접근 조건: `ADMIN (서비스 검사)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [SellerApplicationController.java:37](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L37)
- 처리 연결: [SellerApplicationService.detail](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/SellerApplicationService.java#L43)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public SellerApplicationData detail(@AuthenticationPrincipal Long memberId, @PathVariable Long applicationId)
```

### `POST /api/admin/seller-applications/{applicationId}/approve`

- 기능: 장인 가입 승인
- 접근 조건: `ADMIN (서비스 검사)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [SellerApplicationController.java:42](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L42)
- 처리 연결: [SellerApplicationService.approve](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/SellerApplicationService.java#L49)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public SellerApplicationData approve(@AuthenticationPrincipal Long memberId, @PathVariable Long applicationId)
```

### `POST /api/admin/seller-applications/{applicationId}/reject`

- 기능: 장인 가입 반려
- 접근 조건: `ADMIN (서비스 검사)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [SellerApplicationController.java:47](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L47)
- 처리 연결: [SellerApplicationService.reject](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/SellerApplicationService.java#L61)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public SellerApplicationData reject(@AuthenticationPrincipal Long memberId, @PathVariable Long applicationId,
                                        @Valid @RequestBody Rejection request)
```

요청·반환 모델: [Rejection](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L62)

### `PATCH /api/admin/artisans/applications/{applicationId}/pipeline`

- 기능: 장인 입점 심사 단계 업데이트
- 접근 조건: `ADMIN (서비스 검사)`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [SellerApplicationController.java:53](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L53)
- 처리 연결: [SellerApplicationService.updatePipeline](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/SellerApplicationService.java#L70)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public SellerApplicationPipelineResult updatePipeline(@AuthenticationPrincipal Long memberId, @PathVariable Long applicationId,
                                                           @Valid @RequestBody Pipeline request)
```

요청·반환 모델: [Pipeline](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java#L63)

## notification

### `GET /api/notifications/stream`

- 기능: 알림 SSE 연결
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [NotificationController.java:36](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L36)
- 처리 연결: [NotificationSseService.subscribe](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationSseService.java#L36)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public SseEmitter stream(
        @AuthenticationPrincipal Long memberId
    )
```

### `POST /api/notifications`

- 기능: create
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 201 (@ResponseStatus)
- 원본 CSV: 미기재
- 구현: [NotificationController.java:44](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L44)
- 처리 연결: [NotificationService.create](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationService.java#L23)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<NotificationResponse> create(
        @AuthenticationPrincipal Long memberId,
        @RequestBody @Valid NotificationCreateRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [NotificationCreateRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationCreateRequest.java), [NotificationResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationResponse.java)

### `GET /api/notifications`

- 기능: 알림 목록 조회
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [NotificationController.java:54](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L54)
- 처리 연결: [NotificationService.findAll](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationService.java#L33)
- 주의: 페이지 객체가 아닌 List 반환

```java
public ApiResponse<List<NotificationResponse>> findAll(
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [NotificationResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationResponse.java)

### `GET /api/notifications/unread-count`

- 기능: 읽지 않은 알림 수
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [NotificationController.java:62](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L62)
- 처리 연결: [NotificationService.countUnread](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationService.java#L62)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<UnreadCountResponse> countUnread(
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [UnreadCountResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/UnreadCountResponse.java)

### `PATCH /api/notifications/read-all`

- 기능: 전체 알림 읽음
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 경로 대응
- 구현: [NotificationController.java:70](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L70)
- 처리 연결: [NotificationService.markAllAsRead](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationService.java#L68)
- 주의: 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> markAllAsRead(
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/notifications/{notificationId}`

- 기능: findOne
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [NotificationController.java:79](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L79)
- 처리 연결: [NotificationService.findOne](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationService.java#L41)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<NotificationResponse> findOne(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long notificationId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [NotificationResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationResponse.java)

### `PATCH /api/notifications/{notificationId}/read`

- 기능: markAsRead
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 미기재
- 구현: [NotificationController.java:88](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L88)
- 처리 연결: [NotificationService.markAsRead](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationService.java#L48)
- 주의: CSV에 없는 실제 경로; 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> markAsRead(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long notificationId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `DELETE /api/notifications/{notificationId}`

- 기능: delete
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 미기재
- 구현: [NotificationController.java:98](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/presentation/NotificationController.java#L98)
- 처리 연결: [NotificationService.delete](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationService.java#L55)
- 주의: CSV에 없는 실제 경로; 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> delete(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long notificationId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

## payment

### `GET /api/payments/methods`

- 기능: 결제수단 목록 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:51](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L51)
- 처리 연결: [PaymentProfileService.methods](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java#L30)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<List<PaymentProfileService.PaymentMethodData>> paymentMethods(
        @AuthenticationPrincipal Long memberId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [PaymentProfileService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java)

### `POST /api/payments/methods`

- 기능: 결제수단 등록
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:58](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L58)
- 처리 연결: [PaymentProfileService.registerMethod](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java#L36)
- 주의: 마스킹 카드 정보 저장; PG billing key 발급 아님

```java
public ResponseEntity<ApiResponse<PaymentProfileService.PaymentMethodData>> registerPaymentMethod(
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody RegisterPaymentMethodRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [PaymentProfileService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java), [RegisterPaymentMethodRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L255)

### `DELETE /api/payments/methods/{paymentMethodId}`

- 기능: 결제수단 삭제
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:67](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L67)
- 처리 연결: [PaymentProfileService.deleteMethod](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java#L58)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> deletePaymentMethod(@AuthenticationPrincipal Long memberId,
                                                  @PathVariable Long paymentMethodId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `POST /api/payments/refund-account`

- 기능: 환불 계좌 등록
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:74](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L74)
- 처리 연결: [PaymentProfileService.registerRefundAccount](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java#L72)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<PaymentProfileService.RefundAccountData>> registerRefundAccount(
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody RegisterRefundAccountRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [PaymentProfileService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java), [RegisterRefundAccountRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L266)

### `GET /api/payments/cart`

- 기능: 장바구니 조회
- 접근 조건: `게스트 쿠키 또는 회원`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:83](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L83)
- 처리 연결: [CartService.get](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java#L34)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ApiResponse<CartService.CartData> cart(@AuthenticationPrincipal Long memberId,
                                                  @CookieValue(value = GUEST_CART_COOKIE, required = false) String guestCartId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CartService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java)

### `POST /api/payments/cart/items`

- 기능: 장바구니 상품 추가
- 접근 조건: `게스트 쿠키 또는 회원`
- 성공 HTTP 상태(코드 기준): 201 (cartResponse helper)
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:89](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L89)
- 처리 연결: [CartService.add](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java#L40)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ResponseEntity<ApiResponse<CartService.CartData>> addCartItem(
        @AuthenticationPrincipal Long memberId,
        @CookieValue(value = GUEST_CART_COOKIE, required = false) String guestCartId,
        @Valid @RequestBody CartItemRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CartItemRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L245), [CartService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java)

### `PATCH /api/payments/cart/items/{cartItemId}`

- 기능: 장바구니 수량 변경
- 접근 조건: `게스트 쿠키 또는 회원`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:99](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L99)
- 처리 연결: [CartService.changeQuantity](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java#L63)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ResponseEntity<ApiResponse<CartService.CartData>> changeQuantity(
        @AuthenticationPrincipal Long memberId,
        @CookieValue(value = GUEST_CART_COOKIE, required = false) String guestCartId,
        @PathVariable Long cartItemId,
        @Valid @RequestBody QuantityRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CartService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java), [QuantityRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L253)

### `DELETE /api/payments/cart/items/{cartItemId}`

- 기능: 장바구니 상품 삭제
- 접근 조건: `게스트 쿠키 또는 회원`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:109](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L109)
- 처리 연결: [CartService.delete](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java#L88)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ApiResponse<Void> deleteCartItem(@AuthenticationPrincipal Long memberId,
                                            @CookieValue(value = GUEST_CART_COOKIE, required = false) String guestCartId,
                                            @PathVariable Long cartItemId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `DELETE /api/payments/cart/items`

- 기능: 장바구니 전체 삭제
- 접근 조건: `게스트 쿠키 또는 회원`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:117](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L117)
- 처리 연결: [CartService.deleteAll](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java#L95)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ApiResponse<Void> deleteAllCartItems(@AuthenticationPrincipal Long memberId,
                                                @CookieValue(value = GUEST_CART_COOKIE, required = false) String guestCartId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `POST /api/payments/cart/merge`

- 기능: 장바구니 병합
- 접근 조건: `Authenticated`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:124](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L124)
- 처리 연결: [CartService.merge](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java#L105)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ResponseEntity<ApiResponse<CartService.CartData>> mergeCart(@AuthenticationPrincipal Long memberId,
                                                                        @CookieValue(value = GUEST_CART_COOKIE, required = false) String guestCartId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CartService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java)

### `PATCH /api/payments/cart/items/{cartItemId}/options`

- 기능: 장바구니 옵션 변경
- 접근 조건: `Authenticated`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:133](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L133)
- 처리 연결: [CartService.changeOptions](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java#L73)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ResponseEntity<ApiResponse<CartService.CartData>> changeOptions(
        @AuthenticationPrincipal Long memberId,
        @CookieValue(value = GUEST_CART_COOKIE, required = false) String guestCartId,
        @PathVariable Long cartItemId,
        @Valid @RequestBody CartOptionsRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CartOptionsRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L276), [CartService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java)

### `POST /api/payments/orders`

- 기능: 주문 생성
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:143](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L143)
- 처리 연결: [PaymentService.createOrder](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L47)
- 주의: 현재 카탈로그 어댑터는 옵션 추가금 미계산·배송비 0 (D07)

```java
public ResponseEntity<ApiResponse<PaymentService.OrderData>> createOrder(
        @AuthenticationPrincipal Long memberId,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody CreateOrderRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CreateOrderRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L286), [PaymentService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java)

### `POST /api/payments`

- 기능: 결제 준비
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 201 최초 준비 / 200 기존 READY 재사용
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:152](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L152)
- 처리 연결: [PaymentService.prepare](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L72)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<PaymentService.PreparedPayment>> prepare(
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody PreparePaymentRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [PaymentService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java), [PreparePaymentRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L293)

### `POST /api/payments/confirm`

- 기능: 결제 승인
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:163](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L163)
- 처리 연결: [PaymentService.confirm](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L97)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<PaymentService.PaymentData> confirm(@AuthenticationPrincipal Long memberId,
                                                            @Valid @RequestBody ConfirmPaymentRequest request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ConfirmPaymentRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L297), [PaymentService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java)

### `POST /api/payments/webhooks/toss`

- 기능: tossWebhook
- 접근 조건: `Public; PG 재조회 검증`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [PaymentController.java:169](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L169)
- 처리 연결: [PaymentService.handleWebhook](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L252)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<Void> tossWebhook(@Valid @RequestBody TossWebhookRequest request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [TossWebhookRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L314)

### `POST /api/payments/fail`

- 기능: 결제 실패 처리
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:175](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L175)
- 처리 연결: [PaymentService.fail](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L144)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<Void> fail(@AuthenticationPrincipal Long memberId, @Valid @RequestBody FailPaymentRequest request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [FailPaymentRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L303)

### `POST /api/payments/{paymentId}/cancel`

- 기능: 결제 취소/환불
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:181](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L181)
- 처리 연결: [PaymentService.cancel](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L174)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<PaymentService.PaymentData> cancel(@AuthenticationPrincipal Long memberId, @PathVariable Long paymentId,
                                                           @Valid @RequestBody CancelPaymentRequest request)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CancelPaymentRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L309), [PaymentService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java)

### `POST /api/payments/orders/{orderId}/cancel`

- 기능: cancelOrder
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [PaymentController.java:188](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L188)
- 처리 연결: [PaymentService.cancelOrder](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L203)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<PaymentService.OrderActionData> cancelOrder(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long orderId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [PaymentService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java)

### `PATCH /api/payments/orders/{orderId}/shipping-address`

- 기능: changeShippingAddress
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [PaymentController.java:197](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L197)
- 처리 연결: [PaymentService.changeShippingAddress](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L223)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<PaymentService.ShippingAddressData> changeShippingAddress(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long orderId,
        @Valid @RequestBody ChangeShippingAddressRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ChangeShippingAddressRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L311), [PaymentService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java)

### `POST /api/payments/orders/{orderId}/purchase-confirmation`

- 기능: confirmPurchase
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 미기재
- 구현: [PaymentController.java:206](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L206)
- 처리 연결: [PaymentService.confirmPurchase](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java#L237)
- 주의: CSV에 없는 실제 경로

```java
public ApiResponse<PaymentService.OrderActionData> confirmPurchase(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long orderId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [PaymentService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java)

### `GET /api/payments/orders/{orderId}/delivery`

- 기능: 배송 조회
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:214](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L214)
- 처리 연결: [DeliveryService.get](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/DeliveryService.java#L27)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<DeliveryService.DeliveryData> delivery(@AuthenticationPrincipal Long memberId, @PathVariable Long orderId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [DeliveryService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/DeliveryService.java)

### `POST /api/payments/returns`

- 기능: 교환·반품 신청
- 접근 조건: `Authenticated; 서비스 역할·소유권 검사 별도`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [PaymentController.java:219](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L219)
- 처리 연결: [ReturnService.request](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/ReturnService.java#L41)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<ReturnService.ReturnData>> requestReturn(
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody ReturnRequest request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ReturnRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java#L326), [ReturnService](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/ReturnService.java)

## product

### `GET /api/products/categories`

- 기능: 종목(카테고리) 목록 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [CategoryController.java:21](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/CategoryController.java#L21)
- 처리 연결: [CategoryQueryService.findAllCategories](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryQueryService.java#L21)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<List<CategoryResponse.CategoryItem>> categories()
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CategoryResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryResponse.java)

### `GET /api/products/categories/main`

- 기능: 메인 카테고리 목록 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [CategoryController.java:26](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/CategoryController.java#L26)
- 처리 연결: [CategoryQueryService.findAllCategories](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryQueryService.java#L21)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<List<CategoryResponse.CategoryItem>> mainCategories()
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CategoryResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryResponse.java)

### `GET /api/products/subcategories`

- 기능: 종목 목록 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [CategoryController.java:31](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/CategoryController.java#L31)
- 처리 연결: [CategoryQueryService.findAllSubcategories](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryQueryService.java#L28)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<List<CategoryResponse.SubcategoryItem>> subcategories()
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [CategoryResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryResponse.java)

### `GET /api/products/materials`

- 기능: 소재 목록 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [CategoryController.java:36](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/CategoryController.java#L36)
- 처리 연결: [CategoryQueryService.findMaterials](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryQueryService.java#L35)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ApiResponse<List<String>> materials(
        @RequestParam(required = false) Long subcategoryId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `POST /api/products`

- 기능: 상품 등록
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:43](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L43)
- 처리 연결: [ProductService.create](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L82)
- 주의: 상품 DTO·검색 필터가 공개조회 계약과 다름 (D04)

```java
public ResponseEntity<ApiResponse<ProductResponse>> create(
        @AuthenticationPrincipal Long memberId,
        @Valid @RequestBody ProductRequest.Create request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductRequest.java), [ProductResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductResponse.java)

### `GET /api/products/me`

- 기능: 내 상품 목록 조회
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:68](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L68)
- 처리 연결: [ProductService.findByArtisan](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L108)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public ApiResponse<Page<ProductResponse>> myProducts(
        @AuthenticationPrincipal Long memberId,
        @PageableDefault(size = 20) Pageable pageable
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductResponse.java)

### `GET /api/products`

- 기능: 상품 목록 조회/검색/필터
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:77](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L77)
- 처리 연결: [ProductService.findOnSale](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L113)
- 주의: page(0-based), size; cursor/limit 계약과 다름; 상품 DTO·검색 필터가 공개조회 계약과 다름 (D04)

```java
public ApiResponse<Page<ProductResponse>> list(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) Long subcategoryId,
        @RequestParam(required = false) String giftTheme,
        @RequestParam(required = false) String sort,
        @RequestParam(required = false) Integer minPrice,
        @RequestParam(required = false) Integer maxPrice,
        @RequestParam(required = false) Boolean excludeSoldOut,
        @RequestParam(required = false) Long artisanId,
        @PageableDefault(size = 20) Pageable pageable
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductResponse.java)

### `GET /api/products/{productId}`

- 기능: 상품 상세 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:97](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L97)
- 처리 연결: [ProductService.findById](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L124)
- 주의: 공개 상세 서비스에 판매/발행 상태 필터 없음 (D10)

```java
public ApiResponse<ProductResponse> detail(@PathVariable Long productId)
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductResponse.java)

### `PATCH /api/products/{productId}`

- 기능: 상품 수정
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:102](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L102)
- 처리 연결: [ProductService.update](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L129)
- 주의: 상품 DTO·검색 필터가 공개조회 계약과 다름 (D04)

```java
public ApiResponse<ProductResponse> update(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId,
        @Valid @RequestBody ProductRequest.Update request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductRequest.java), [ProductResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductResponse.java)

### `PATCH /api/products/{productId}/status`

- 기능: 상품 상태 변경
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:128](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L128)
- 처리 연결: [ProductService.changeStatus](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L157)
- 주의: 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> changeStatus(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId,
        @Valid @RequestBody ProductRequest.ChangeStatus request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductRequest.java)

### `DELETE /api/products/{productId}`

- 기능: 상품 삭제
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:139](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L139)
- 처리 연결: [ProductService.delete](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductService.java#L167)
- 주의: 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> delete(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `POST /api/products/{productId}/wish`

- 기능: 상품 찜
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:149](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L149)
- 처리 연결: [MemberActivityService.wish](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L65)
- 주의: 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> wish(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `DELETE /api/products/{productId}/wish`

- 기능: 상품 찜 취소
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 200 기본값; 본문 status=204 (D08)
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:159](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L159)
- 처리 연결: [MemberActivityService.unwish](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/MemberActivityService.java#L72)
- 주의: 본문 status=204와 실제 HTTP 상태를 구분 (D08)

```java
public ApiResponse<Void> unwish(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

### `GET /api/products/{productId}/questions`

- 기능: 상품 문의 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:169](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L169)
- 처리 연결: [ProductQnaService.findQuestions](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaService.java#L29)
- 주의: page(0-based), size; cursor/limit 계약과 다름; 비밀 질문의 답변 마스킹 별도 확인 필요 (D09)

```java
public ApiResponse<Page<ProductQnaResponse.QuestionView>> questions(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId,
        @PageableDefault(size = 20) Pageable pageable
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductQnaResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaResponse.java)

### `POST /api/products/{productId}/questions`

- 기능: 상품 문의 작성
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:178](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L178)
- 처리 연결: [ProductQnaService.ask](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaService.java#L39)
- 주의: 컨트롤러와 처리 코드 연결 확인; 명세 전체 일치/실서버 통과 판정 아님

```java
public ResponseEntity<ApiResponse<ProductQnaResponse.QuestionView>> ask(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId,
        @Valid @RequestBody ProductQnaRequest.Ask request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductQnaRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductQnaRequest.java), [ProductQnaResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaResponse.java)

### `POST /api/products/{productId}/questions/{questionId}/answer`

- 기능: answer
- 접근 조건: `hasRole('ARTISAN')`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 미기재
- 구현: [ProductController.java:191](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L191)
- 처리 연결: [ProductQnaService.answer](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaService.java#L52)
- 주의: CSV에 없는 실제 경로

```java
public ResponseEntity<ApiResponse<ProductQnaResponse.AnswerView>> answer(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId,
        @PathVariable Long questionId,
        @Valid @RequestBody ProductQnaRequest.Answer request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductQnaRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductQnaRequest.java), [ProductQnaResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaResponse.java)

### `GET /api/products/{productId}/reviews`

- 기능: 상품 후기 조회
- 접근 조건: `Public`
- 성공 HTTP 상태(코드 기준): 200
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:205](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L205)
- 처리 연결: [ProductReviewService.findReviews](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductReviewService.java#L45)
- 주의: page(0-based), size; cursor/limit 계약과 다름

```java
public ApiResponse<Page<ProductReviewResponse.ReviewView>> reviews(
        @PathVariable Long productId,
        @PageableDefault(size = 20) Pageable pageable
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductReviewResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductReviewResponse.java)

### `POST /api/products/{productId}/reviews`

- 기능: 상품 후기 작성
- 접근 조건: `hasRole('USER')`
- 성공 HTTP 상태(코드 기준): 201
- 원본 CSV: 경로 대응
- 구현: [ProductController.java:213](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductController.java#L213)
- 처리 연결: [ProductReviewService.write](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductReviewService.java#L54)
- 주의: 서비스에서 구매 소유권/후기 작성 자격 검증 누락 (D09)

```java
public ResponseEntity<ApiResponse<ProductReviewResponse.ReviewView>> writeReview(
        @AuthenticationPrincipal Long memberId,
        @PathVariable Long productId,
        @Valid @RequestBody ProductReviewRequest.Write request
    )
```

요청·반환 모델: [ApiResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java), [ProductReviewRequest](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductReviewRequest.java), [ProductReviewResponse](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductReviewResponse.java)

## DTO record 필드 선언

위 시그니처에서 직접 참조하는 프로젝트 타입의 record 선언을 추출했다. 중첩 record도 함께 표시한다. JSON 필드명·필수 조건·범위는 annotation을 우선하고, `toCommand` 등 변환 메소드와 서비스 검증은 원문 링크에서 확인한다. DTO가 참조하는 다른 클래스/enum은 원문 import를 따라 확인한다. 선언의 Java 타입을 그대로 노출한 것으로 완성된 OpenAPI 스키마는 아니다.

### ChatResponse

[ChatResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/application/ChatResponse.java)

```java
record SessionView(
        UUID sessionId,
        int expiresInSeconds
    )

record MessageView(
        Long messageId,
        UUID sessionId,
        ChatSender sender,
        String content,
        LocalDateTime sentAt
    )

record ThumbnailVariant(
        String url,
        int width,
        int height,
        String format
    )

record ProductCard(
        Long productId,
        String name,
        int price,
        List<ThumbnailVariant> thumbnail,
        String status,
        String category,
        String subcategory,
        String color,
        String giftTheme,
        Double rating,
        boolean isLimited,
        boolean isCustomOrder,
        boolean isSingleItem,
        boolean isNew,
        boolean hasGiftWrap,
        boolean hasOptions,
        List<String> purposeTags,
        String primaryBadge,
        Long artisanId,
        String artisanName,
        String reason
    )

record SendResult(
        UUID sessionId,
        Long messageId,
        String reply,
        String intent,
        List<String> suggestions,
        List<ProductCard> products
    )
```

### ChatRequest

[ChatRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/chatbot/presentation/ChatRequest.java)

```java
record SendMessage(
        @NotBlank @Size(max = 2000) String content
    )
```

### BeToAiPersistAckResponse

[BeToAiPersistAckResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/BeToAiPersistAckResponse.java)

```java
record BeToAiPersistAckResponse(
    @JsonProperty("generation_id") String generationId,
    @JsonProperty("product_id") String productId,
    String status,
    @JsonProperty("saved_at") LocalDateTime savedAt
)
```

### ContentResponse

[ContentResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/ContentResponse.java)

```java
record Detail(Long contentId, Long productId, ContentStatus status, int version,
                  @JsonRawValue String reactDocument,
                  @JsonInclude(JsonInclude.Include.NON_EMPTY) List<Block> blocks)

record Block(int order, String tag, boolean hasImage, List<ImageVariant> imageVariants,
                 String videoUrl, String text)

record ImageVariant(String url, int width, int height, String format)

record BlockChanged(Long contentId, int version, Block block)

record VersionHistory(int version, LocalDateTime editedAt, EditedByType editedBy)

record StatusChanged(Long contentId, ContentStatus status)

record BulkUpdated(Long contentId, Long productId, ContentStatus status, int version)

record BlockUpdated(Long contentId, int version, String nodeId)
```

### GenerationResponse

[GenerationResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/GenerationResponse.java)

```java
record GenerationResponse(
    Long generationId,
    Long productId,
    GenerationStatus status,
    LocalDateTime requestedAt,
    LocalDateTime completedAt
)
```

### InterviewResponse

[InterviewResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/application/InterviewResponse.java)

```java
record InterviewResponse(
    Long productId,
    String process,
    String materials,
    String technique,
    String story
)
```

### ContentRequest

[ContentRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/ContentRequest.java)

```java
record Approve(@NotNull Boolean factCheckConfirmed, @NotNull Boolean photoMatchConfirmed,
                   @NotNull Boolean displayApprovalBadge)

record ReplaceBlocks(@NotNull @Size(min = 1, max = 100) List<@Valid Block> blocks)

record UpdateBlock(String tag, Boolean hasImage, String imageUrl, String videoUrl, String text)

record Block(@NotNull Integer order, @NotNull String tag, Boolean hasImage, String imageUrl,
                 String videoUrl, String text)

record BulkUpdate(@NotEmpty @Valid List<NodePatchItem> patches)

record NodePatchItem(@NotBlank String nodeId, String text, String imageId)

record BlockUpdate(String text, String imageId)
```

### GenerationRequest

[GenerationRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/GenerationRequest.java)

```java
record Create(
        @NotEmpty(message = "이미지 목록은 비워둘 수 없습니다")
        @Size(max = 8, message = "이미지는 최대 8장까지 첨부할 수 있습니다")
        List<@NotBlank String> images,

        @NotBlank(message = "작품명은 필수입니다")
        @Size(max = 15, message = "작품명은 15자 이내여야 합니다")
        String productName,

        @NotBlank(message = "제작 과정은 필수입니다")
        String howMade,

        @NotBlank(message = "관리 방법은 필수입니다")
        String careTips
    )
```

### InterviewRequest

[InterviewRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/content/presentation/InterviewRequest.java)

```java
record Create(
        @NotBlank(message = "제작 과정은 필수입니다") String process,
        @NotBlank(message = "재료는 필수입니다") @Size(max = 255, message = "재료는 255자 이내여야 합니다") String materials,
        @NotBlank(message = "기법은 필수입니다") @Size(max = 100, message = "기법은 100자 이내여야 합니다") String technique,
        @NotBlank(message = "작품 스토리는 필수입니다") String story
    )

record Update(
        String process,
        @Size(max = 255, message = "재료는 255자 이내여야 합니다") String materials,
        @Size(max = 100, message = "기법은 100자 이내여야 합니다") String technique,
        String story
    )
```

### ApiResponse

[ApiResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/common/response/ApiResponse.java)

```java
record ApiResponse<T>(boolean success, int status, T data)
```

### DevAuthController

[DevAuthController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/global/dev/DevAuthController.java)

```java
record DevTokenResponse(String accessToken, String role, Long memberId)

record DevSetupResponse(Long artisanId, Long productId, String accessToken)
```

### ImageService

[ImageService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/application/ImageService.java)

```java
record UploadVariant(String name, long sizeBytes)

record CreatePresignedUpload(String fileName, String contentType, ImagePurpose purpose,
                                        int sourceWidth, int sourceHeight, List<UploadVariant> variants)

record VariantUpload(String variant, String objectKey, String presignedUrl, String viewUrl)

record PresignedUpload(String imageId, List<VariantUpload> uploads, int expiresInSeconds)

record Verification(boolean exists, boolean ownerMatched, List<String> variants)

record PublicVariant(String url, int width, int height, String format)
```

### ImageController

[ImageController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/image/presentation/ImageController.java)

```java
record PresignedUrlRequest(@NotBlank @Size(max = 255) String fileName,
                                      @NotBlank @Size(max = 100) String contentType,
                                      @NotNull ImagePurpose purpose,
                                      @Positive int sourceWidth,
                                      @Positive int sourceHeight,
                                      @NotEmpty @Size(max = 3) List<@Valid @NotNull VariantRequest> variants,
                                      Long memberId)

record VariantRequest(@NotBlank String name, @Positive Long sizeBytes)

record VerifyImageRequest(@NotBlank @Size(max = 30) String imageId, @NotNull Long requesterId)
```

### AddressData

[AddressData.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/application/AddressData.java)

```java
record AddressData(Long addressId, String recipientName, String phone, String zipCode,
                          String address1, String address2, boolean isDefault)
```

### ArtisanController

[ArtisanController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/ArtisanController.java)

```java
record Profile(@Size(min = 1, max = 100) @Pattern(regexp = ".*\\S.*") String businessName,
            @Size(max = 255) String introduction, @Size(max = 500) @Pattern(regexp = "https://[^\\s]+") String profileImageUrl,
            @Size(max = 30) String profileImageId,
            @Size(min = 1, max = 50) String category, @Size(max = 100) String region,
            @Min(0) @Max(200) Short careerYears, @Min(1900) @Max(2200) Short certifiedYear,
            @Size(max = 255) String lineage, @Size(max = 500) String quote, @Size(max = 65535) String bio,
            @Size(max = 500) @Pattern(regexp = "https://[^\\s]+") String videoUrl)
```

### EmailVerificationRequest

[EmailVerificationRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/EmailVerificationRequest.java)

```java
record Send(
        @NotBlank @Email @Size(max = 255) String email
    )

record Verify(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "인증 코드는 6자리 숫자입니다") String code
    )
```

### MemberAccountRequests

[MemberAccountRequests.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberAccountRequests.java)

```java
record Profile(@Size(min = 1, max = 50) @Pattern(regexp = ".*\\S.*") String name,
                          @Size(min = 1, max = 50) @Pattern(regexp = ".*\\S.*") String nickname,
                          @Pattern(regexp = "\\d{9,20}") String phone)

record Password(@NotBlank @Size(max = 72) String currentPassword,
                           @NotBlank @Size(min = 8, max = 72) String newPassword)

record Withdrawal(@NotBlank @Size(max = 500) String reason)

record CreateAddress(@NotBlank @Size(max = 50) String recipientName,
                                @NotBlank @Pattern(regexp = "\\d{9,20}") String phone,
                                @NotBlank @Size(max = 10) String zipCode,
                                @NotBlank @Size(max = 255) String address1,
                                @Size(max = 255) String address2,
                                @NotNull Boolean isDefault)

record UpdateAddress(@Size(min = 1, max = 50) @Pattern(regexp = ".*\\S.*") String recipientName,
                                @Pattern(regexp = "\\d{9,20}") String phone,
                                @Size(min = 1, max = 10) @Pattern(regexp = ".*\\S.*") String zipCode,
                                @Size(min = 1, max = 255) @Pattern(regexp = ".*\\S.*") String address1,
                                @Size(max = 255) String address2, Boolean isDefault)
```

### MemberLoginRequest

[MemberLoginRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberLoginRequest.java)

```java
record MemberLoginRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank String password
)
```

### MemberLoginResponse

[MemberLoginResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberLoginResponse.java)

```java
record MemberLoginResponse(
    String accessToken,
    MemberProfileResponse member
)
```

### MemberProfileResponse

[MemberProfileResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberProfileResponse.java)

```java
record MemberProfileResponse(
    Long memberId,
    String email,
    String name,
    String nickname,
    MemberRole role,
    String profileImageUrl,
    String provider,
    String phone
)
```

### MemberSignupRequest

[MemberSignupRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberSignupRequest.java)

```java
record MemberSignupRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 72, message = "비밀번호는 8자 이상 72자 이하여야 합니다") String password,
    @NotBlank String passwordConfirm,
    @NotBlank @Size(max = 50) String name,
    @NotBlank @Pattern(regexp = "\\d{9,20}") String phone,
    @NotNull MemberRole role,
    @NotNull @Valid Agreements agreements
)

record Agreements(
        @NotNull Boolean age14OrOlder,
        @NotNull Boolean termsOfService,
        @NotNull Boolean privacyCollection,
        Boolean marketing
    )
```

### MemberSignupResponse

[MemberSignupResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberSignupResponse.java)

```java
record MemberSignupResponse(
    String accessToken,
    MemberProfileResponse member
)
```

### MemberTokenRefreshResponse

[MemberTokenRefreshResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/dto/MemberTokenRefreshResponse.java)

```java
record MemberTokenRefreshResponse(
    String accessToken,
    long expiresIn
)
```

### MemberActivityController

[MemberActivityController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/MemberActivityController.java)

```java
record Settings(Boolean darkMode, Boolean marketing)

record RecentView(@NotNull @Positive Long productId)

record RecentViews(@NotNull @Size(max = 100) List<@NotNull @Positive Long> productIds)

record Notifications(@NotNull Boolean notificationsEnabled)
```

### OAuthController

[OAuthController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/OAuthController.java)

```java
record ExchangeResponse(boolean onboardingRequired,String accessToken)

record CompletionResponse(Long memberId,String email,MemberRole role,String accessToken,String provider)

record CompleteProfile(@NotBlank @Size(max=50) String name,@NotBlank @Pattern(regexp="\\d{9,20}") String phone,
                                  @NotNull @Valid MemberSignupRequest.Agreements agreements)
```

### SellerApplicationController

[SellerApplicationController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/member/presentation/SellerApplicationController.java)

```java
record ApplicationRequest(@NotBlank @Size(max = 100) String businessName,
                                     @NotBlank @Size(max = 255) String introduction,
                                     @NotBlank @Size(max = 500) @Pattern(regexp = "https://[^\\s]+") String businessLicenseImageUrl)

record Rejection(@NotBlank @Size(max = 65535) String reason)

record Pipeline(@NotNull SellerApplication.Step step, @NotNull SellerApplication.Stage status,
                           SellerApplication.Qualification qualificationTier)
```

### NotificationCreateRequest

[NotificationCreateRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationCreateRequest.java)

```java
record NotificationCreateRequest(
    @NotBlank(message = "알림 제목은 필수입니다") @Size(max = 255, message = "알림 제목은 255자 이내여야 합니다") String title,
    @NotBlank(message = "알림 내용은 필수입니다") @Size(max = 255, message = "알림 내용은 255자 이내여야 합니다") String content
)
```

### NotificationResponse

[NotificationResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/NotificationResponse.java)

```java
record NotificationResponse(
    Long id,
    String title,
    String content,
    NotificationStatus status,
    LocalDateTime createdAt
)
```

### UnreadCountResponse

[UnreadCountResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/notification/application/UnreadCountResponse.java)

```java
record UnreadCountResponse(long unreadCount)
```

### CartService

[CartService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/CartService.java)

```java
record CartCommand(Long productId, int quantity, List<CheckoutCatalog.OptionSelection> selectedOptions,
                              List<CheckoutCatalog.TextInput> textInputs)

record CartOptionsCommand(Integer quantity, List<CheckoutCatalog.OptionSelection> selectedOptions,
                                     List<CheckoutCatalog.TextInput> textInputs)

record CartItemData(Long cartItemId, Long productId, String productName, long unitPrice, int quantity,
                               long subtotal, List<CheckoutCatalog.ImageVariant> thumbnail, boolean isCustomOrder,
                               boolean soldOut, boolean selected,
                               List<CheckoutCatalog.SelectedOptionView> selectedOptions,
                               List<CheckoutCatalog.TextInputView> textInputs)

record CartSection(Long artisanId, String artisanName, String certificationLevel, List<CartItemData> items,
                              long shippingFee, Long freeShippingThreshold)

record CartData(List<CartSection> sections, long totalPrice, long totalShippingFee, int totalCount)

record CartMutation(CartData cart, String guestCartId)

record EnrichedCartItem(CartItem item, CheckoutCatalog.CartProductView product)
```

### DeliveryService

[DeliveryService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/DeliveryService.java)

```java
record DeliveryData(Long orderId, String carrierCode, String carrierName, String carrier,
                               String trackingNumber, DeliveryStatus status,
                               java.util.List<DeliveryTrackingGateway.TrackingEvent> history)
```

### PaymentProfileService

[PaymentProfileService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentProfileService.java)

```java
record RegisterPaymentMethod(PaymentMethod type, String cardNumber, String expiry,
                                        String birthOrBusinessNo)

record RegisterRefundAccount(String bankName, String accountNumber, String accountHolder)

record PaymentMethodData(Long paymentMethodId, PaymentMethod type, String cardCompany,
                                    String cardNumberMasked, boolean isDefault)

record RefundAccountData(Long refundAccountId, String bankName, String accountNumberMasked,
                                    String accountHolder)
```

### PaymentService

[PaymentService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/PaymentService.java)

```java
record CreateOrder(List<Long> cartItemIds, Long addressId, String deliveryRequest, PaymentMethod paymentMethod)

record Prepare(Long orderId, long amount, PaymentMethod method)

record Confirm(String paymentKey, String orderNumber, long amount)

record Fail(String orderNumber, String errorCode, String errorMessage)

record Webhook(String eventType, String paymentKey, String orderNumber, long totalAmount, String status)

record QuotedLine(CheckoutCartReader.CartLine cartLine, CheckoutCatalog.ProductQuote quote)

record OrderData(Long orderId, String orderNumber, long totalAmount, OrderStatus status, Instant createdAt,
                            List<OrderItemData> items)

record OrderItemData(Long orderItemId, Long productId, String productName, long price, int quantity, long totalPrice)

record PreparedPayment(Long paymentId, Long orderId, long amount, String tossClientKey, boolean created)

record PaymentData(Long paymentId, Long orderId, String orderNumber, long amount, PaymentMethod method, PaymentStatus status,
                              Instant approvedAt, Instant canceledAt)

record OrderActionData(Long orderId, OrderStatus status, Instant canceledAt, Instant purchaseConfirmedAt)

record ShippingAddressData(Long orderId, Long addressId, String recipientName, String phone,
                                      String zipCode, String address1, String address2)
```

### ReturnService

[ReturnService.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/application/ReturnService.java)

```java
record RequestReturn(Long orderId, ReturnType type, List<Long> orderItemIds, ReturnReason reason,
                                String description, List<String> imageIds, Long returnAddressId)

record ReturnData(Long returnId, Long orderId, ReturnType type, ReturnStatus status, Instant requestedAt)
```

### PaymentController

[PaymentController.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/payment/presentation/PaymentController.java)

```java
record CartItemRequest(@NotNull Long productId, @Positive int quantity,
                                  List<@Valid OptionSelectionRequest> selectedOptions,
                                  List<@Valid TextInputRequest> textInputs)

record QuantityRequest(@Positive int quantity)

record RegisterPaymentMethodRequest(
        @NotNull PaymentMethod type,
        @NotBlank @Pattern(regexp = "[0-9 -]{13,25}") String cardNumber,
        @NotBlank @Pattern(regexp = "(0[1-9]|1[0-2])/?[0-9]{2}") String expiry,
        @NotBlank @Pattern(regexp = "([0-9]{6}|[0-9]{10})") String birthOrBusinessNo
    )

record RegisterRefundAccountRequest(
        @NotBlank @Size(max = 50) @Pattern(regexp = "[가-힣A-Za-z ]+") String bankName,
        @NotBlank @Pattern(regexp = "[0-9-]{8,30}") String accountNumber,
        @NotBlank @Size(max = 50) @Pattern(regexp = "[가-힣A-Za-z ]+") String accountHolder
    )

record CartOptionsRequest(@Positive Integer quantity, List<@Valid OptionSelectionRequest> selectedOptions,
                                     List<@Valid TextInputRequest> textInputs)

record OptionSelectionRequest(@NotNull Long optionGroupId, @NotNull Long choiceId)

record TextInputRequest(@NotNull Long optionGroupId, @NotBlank @Size(max = 500) String text)

record CreateOrderRequest(@NotNull List<@NotNull Long> cartItemIds, @NotNull Long addressId,
                                     @Size(max = 100) String deliveryRequest, @NotNull PaymentMethod paymentMethod)

record PreparePaymentRequest(@NotNull Long orderId, @Positive long amount, PaymentMethod paymentMethod)

record ConfirmPaymentRequest(@NotBlank @Size(max = 200) String paymentKey,
                                        @NotBlank @Size(min = 6, max = 64) String orderId,
                                        @Positive long amount)

record FailPaymentRequest(@NotBlank @Size(min = 6, max = 64) String orderId,
                                     @NotBlank @Size(max = 100) String errorCode,
                                     @NotBlank @Size(max = 255) String errorMessage)

record CancelPaymentRequest(@NotBlank @Size(max = 200) String reason)

record ChangeShippingAddressRequest(@NotNull @Positive Long addressId)

record TossWebhookRequest(@NotBlank String eventType, @NotNull @Valid TossPaymentData data)

record TossPaymentData(@NotBlank @Size(max = 200) String paymentKey,
                                  @NotBlank @Size(min = 6, max = 64) String orderId,
                                  @Positive long totalAmount,
                                  @NotBlank @Size(max = 30) String status)

record ReturnRequest(@NotNull Long orderId, @NotNull ReturnType type,
                                @NotEmpty List<@NotNull Long> orderItemIds, @NotNull ReturnReason reason,
                                @JsonAlias("reasonDetail") @Size(max = 500) String description,
                                @JsonAlias("returnPhotoKeys") @Size(max = 5) List<@NotBlank @Size(max = 30) String> imageIds,
                                Long returnAddressId)
```

### CategoryResponse

[CategoryResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/CategoryResponse.java)

```java
record CategoryItem(Long categoryId, String name)

record SubcategoryItem(Long subcategoryId, Long categoryId, String name)
```

### ProductQnaResponse

[ProductQnaResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductQnaResponse.java)

```java
record QuestionView(
        Long questionId,
        Long productId,
        Long writerId,
        String content,
        boolean secret,
        LocalDateTime createdAt,
        AnswerView answer
    )

record AnswerView(
        Long answerId,
        Long artisanId,
        String content,
        LocalDateTime answeredAt
    )
```

### ProductResponse

[ProductResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductResponse.java)

```java
record ProductResponse(
    Long productId,
    Long artisanId,
    Long categoryId,
    String categoryName,
    Long subcategoryId,
    String subcategoryName,
    String title,
    String description,
    int price,
    int stock,
    String thumbnailUrl,
    String status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<String> giftThemes,
    List<String> purposeTags,
    Integer productionPeriodDays,
    List<String> colors,
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    List<ProductImageView> images,
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    List<ContentBlockView> detailPageBlocks,
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    List<ImageVariantView> thumbnail
)

record ProductImageView(String imageId, String alt, List<ImageVariantView> variants)

record ImageVariantView(String url, int width, int height, String format)

record ContentBlockView(int order, String tag, boolean hasImage,
                                   List<ImageVariantView> imageVariants, String videoUrl, String text)
```

### ProductReviewResponse

[ProductReviewResponse.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/application/ProductReviewResponse.java)

```java
record ReviewView(
        Long reviewId,
        Long productId,
        Long writerId,
        Long orderItemId,
        BigDecimal rating,
        String content,
        List<String> images,
        LocalDateTime createdAt
    )
```

### ProductQnaRequest

[ProductQnaRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductQnaRequest.java)

```java
record Ask(
        @NotBlank(message = "문의 내용은 필수입니다") @Size(max = 1000, message = "문의 내용은 1000자 이내여야 합니다") String content,
        @NotNull(message = "비공개 여부는 필수입니다") Boolean secret
    )

record Answer(
        @NotBlank(message = "답변 내용은 필수입니다") @Size(max = 2000, message = "답변 내용은 2000자 이내여야 합니다") String content
    )
```

### ProductRequest

[ProductRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductRequest.java)

```java
record Create(
        Long categoryId,
        Long subcategoryId,
        @NotBlank(message = "상품명은 필수입니다") @Size(max = 200, message = "상품명은 200자 이내여야 합니다") String title,
        String description,
        @Positive(message = "가격은 1 이상이어야 합니다") int price,
        @Min(value = 0, message = "재고는 0 이상이어야 합니다") int stock,
        @Size(max = 500, message = "썸네일 URL은 500자 이내여야 합니다") String thumbnailUrl,
        List<@Size(max = 50, message = "선물 테마는 50자 이내여야 합니다") String> giftThemes,
        List<@Size(max = 100, message = "용도 태그는 100자 이내여야 합니다") String> purposeTags,
        @Positive(message = "제작 기간은 1일 이상이어야 합니다") Integer productionPeriodDays,
        List<@Size(max = 20, message = "색상 코드는 20자 이내여야 합니다") String> colors,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        List<@NotBlank @Size(max = 30, message = "이미지 ID는 30자 이내여야 합니다") String> images
    )

record Update(
        Long categoryId,
        Long subcategoryId,
        @NotBlank(message = "상품명은 필수입니다") @Size(max = 200, message = "상품명은 200자 이내여야 합니다") String title,
        String description,
        @Positive(message = "가격은 1 이상이어야 합니다") int price,
        @Min(value = 0, message = "재고는 0 이상이어야 합니다") int stock,
        @Size(max = 500, message = "썸네일 URL은 500자 이내여야 합니다") String thumbnailUrl,
        List<@Size(max = 50, message = "선물 테마는 50자 이내여야 합니다") String> giftThemes,
        List<@Size(max = 100, message = "용도 태그는 100자 이내여야 합니다") String> purposeTags,
        @Positive(message = "제작 기간은 1일 이상이어야 합니다") Integer productionPeriodDays,
        List<@Size(max = 20, message = "색상 코드는 20자 이내여야 합니다") String> colors,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        List<@NotBlank @Size(max = 30, message = "이미지 ID는 30자 이내여야 합니다") String> images
    )

record ChangeStatus(
        @NotNull(message = "상태값은 필수입니다") String status
    )
```

### ProductReviewRequest

[ProductReviewRequest.java](https://github.com/Jangingmall/backend/blob/48417a651476c57606ff7567ea8b204962acf9c0/src/main/java/com/jangingmall/backend/product/presentation/ProductReviewRequest.java)

```java
record Write(
        @NotNull(message = "주문 항목 ID는 필수입니다") Long orderItemId,
        @NotNull(message = "평점은 필수입니다")
        @DecimalMin(value = "1.0", message = "평점은 1 이상이어야 합니다")
        @DecimalMax(value = "5.0", message = "평점은 5 이하여야 합니다")
        @Digits(integer = 1, fraction = 1, message = "평점은 소수점 첫째 자리까지 입력할 수 있습니다") BigDecimal rating,
        @NotBlank(message = "후기 내용은 필수입니다") @Size(max = 2000, message = "후기 내용은 2000자 이내여야 합니다") String content,
        @Size(max = 5, message = "후기 이미지는 최대 5장까지 등록할 수 있습니다")
        List<@NotBlank @Size(max = 30) String> images
    )
```
