# 상품 상세 PD-1

[작업 이슈 #34](https://github.com/Jangingmall/frontend/issues/34) · [Figma 기본 화면](https://www.figma.com/design/ZSESuanQor1IT8mr67JjmI/?node-id=1360-33268)

기존 GNB·Footer와 색상·글자·Button·Select·Stepper·Accordion·Pagination 등을 사용한다. 공용 디자인 시스템에는 접근성 처리를 제공하는 Base UI Dialog만 추가했다.

TOP은 홈 PR #33에서 병합된 공용 `FloatingActions`를 재사용한다. 상세 화면에서는 AI CHAT을 숨기고 TOP만 표시한다.

## 실행

다음 값을 `.env.local`에 설정한 후 `npm run dev`로 실행한다.

```dotenv
NEXT_PUBLIC_API_MOCKING=enabled
API_BASE_URL=http://localhost:3000
```

상품 목록(`/products`)의 카드로 진입하거나 `/products/백자-달항아리-101`을 연다. 이름이 바뀐 주소는 ID로 조회한 뒤 최신 주소로 이동한다. 다른 포트에서는 `API_BASE_URL`과 실행 포트를 함께 변경한다. 모의 handler를 수정한 뒤 서버 요청이 실제 404로 빠지면 개발 서버를 재시작한다(Next 개발 서버의 fetch 패치와 MSW 초기화는 별개다).

기존 인증 mock은 세션 복원을 기본 성공으로 처리하므로 개발 화면은 회원 1번으로 시작한다. 로그인 실패·비회원·권한 변화는 컴포넌트/API 테스트에서 별도로 검증한다.

| ID  | 확인할 상태                                                |
| --- | ---------------------------------------------------------- |
| 101 | 기본, 필수 색상·크기 + 선택 선물 포장, 후기 12개, 문의 8개 |
| 102 | 옵션 없음, 후기·문의 없음                                  |
| 103 | 품절·재입고 알림                                           |
| 104 | 필수 옵션 3개                                              |
| 105 | 필수 옵션 1개                                              |
| 106 | 재고·이미지·장인 정보 누락, 구매 비활성                    |
| 997 | 서버 오류와 재시도                                         |
| 999 | 존재하지 않는 상품                                         |

상품 사진·장인 사진은 아직 제공되지 않아 기존 placeholder 자산을 사용한다. 설명·배송·A/S 문구와 게시 본문은 개발용 예시이며 운영 확정 문구가 아니다.

## 구현 범위

- 최대 6개 이미지, 썸네일, 확대·방향키·Esc·배경 닫기·포커스 복귀.
- 필수 옵션 순차 선택, 다음 메뉴 자동 열기, 선물 포장 추가금, 조합별 카드, 수량·재고 상한, 합계, 삭제.
- 품절, 선택 누락, 모의 장바구니 중복·찜·재입고 상태와 실패 피드백.
- 장인 소개, 공개 콘텐츠 블록, 상세 정보, 안내 아코디언, 섹션 이동, 공유, TOP, 같은 작가의 다른 작품.
- 후기 정렬·사진 필터·5개 페이지, 문의 3개 요약·전체 목록·비밀글·작성·등록 후 갱신.
- 데스크톱 Figma 배치와 320px 이상 기본 재배치. 공통 헤더 높이를 피하도록 구매 패널을 고정한다.

공통 GNB는 기존 구현을 유지했다. 320px처럼 좁은 화면에서는 기존 내비게이션 글자가 여러 줄로 접히므로, 공통 헤더의 모바일 대응은 별도 개선이 필요하다.

## 데이터 경계와 후속 연결

`detail-api.ts`는 실제 `GET /api/products/{id}`의 기본 DTO를 검증한다. `DRAFT`·`HIDDEN`은 화면에 표시하지 않는다. 장인 소개·다중 이미지·옵션·상세 정보는 실제 응답에 없으므로 운영 모드에서 만들어내지 않는다. 공개 조회에는 상품 및 장인 ISR 태그를 사용하고, 사용자별 상태는 클라이언트 Query에 둔다.

확장된 상세 응답은 MSW 플래그가 켜진 경우에만 `productDetailMockDto`로 읽는다. 다음 endpoint는 UI 시연을 위한 **잠정 mock 계약**이다.

| 기능           | 경로                                               |
| -------------- | -------------------------------------------------- |
| 찜·재입고 상태 | `GET /api/products/:id/detail-actions`             |
| 찜             | `PUT /api/products/:id/detail-actions/wishlist`    |
| 담기           | `POST /api/products/:id/detail-actions/cart-items` |
| 재입고         | `POST /api/products/:id/detail-actions/restock`    |
| 후기           | `GET /api/mock/products/:id/reviews`               |
| 문의           | `GET/POST /api/mock/products/:id/inquiries`        |

실제 모드에서는 미확정 endpoint로 요청하지 않는다. 모의 장바구니·찜·문의·알림은 MSW 실행 중에만 유지된다. 로그인·장바구니·주문·결제·장인 상세 화면 연결은 후속 작업이며, 준비되지 않은 목적지로 이동하거나 임시 주문 성공을 만들지 않는다. 비회원 장바구니의 전역 정책은 변경하지 않았다.

문의의 비공개 제목·본문·답변은 응답에서 제거하고, 캐시를 사용자별로 구분한다. 콘텐츠 블록은 텍스트와 검증된 이미지 참조만 렌더한다. 판매자 편집기의 내부 JSON·AI 생성 기능은 이 범위에 포함하지 않는다.

## 검증

`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run build-storybook`과 `npm run test:e2e`를 사용한다.

E2E는 목록 왕복, 한글 URL 정규화·새로고침, 이미지 확대, 옵션·합계·담기, 품절·빈 상태, 후기 필터, 문의 등록, 오류, 모바일 모달을 검증한다. 단위·컴포넌트 테스트는 비공개 응답, 재고·추가금, 실패 복구, 모달과 필터의 키보드 동작을 포함한다.
