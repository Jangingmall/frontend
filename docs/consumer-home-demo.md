# 소비자 홈 시연 콘텐츠

홈 베스트 5개와 기획전 4개는 API/MSW 모드 모두 `src/api/home/mock/fixtures.ts`의 상품 목록과 `public/home-products/`의 정적 이미지 9개를 사용합니다. 소비자 화면에는 `베스트 상품 시연`, `기획전 시연` 문구를 표시하지 않습니다.

`src/api/home/demo-server.ts`는 MSW `getResponse`로 홈 상품을 직접 읽습니다. Next.js 정적 빌드에서 instrumentation의 전역 resolver가 없는 경우에도 상품을 렌더링하기 위해서입니다. 홈 신상품 조회는 기존 공개 상품 API 경로를 유지합니다.

홈 베스트의 청자 분청 찻잔은 기존 시연 상품 `900002`의 상세페이지로 이동합니다. 상세가 없는 나머지 네 카드는 `inert`로 클릭과 키보드 포커스를 막습니다. 기획전 카드·전체보기의 기존 전시 전용 동작도 유지합니다.

찻잔 상세 이미지는 `/images/chatbot-demo/teacup-detail-clean.png`를 사용합니다. 시연 주문번호 `MIDAM-20261005-482731`은 완료 화면의 기본 예시이며, 실제 주문은 서버에서 받은 주문번호를 사용합니다.

## 배포 전 확인

- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`를 실행합니다.
- API 모드 빌드의 `.next/server/app/index.html`에 서로 다른 `/home-products/` 이미지 URL 9개가 포함됐는지 확인합니다. 빌드 성공만으로 홈 데이터 조회 성공을 판단하지 않습니다.
- 브라우저에서 홈 베스트·기획전 상품, 시연 문구 제거, 찻잔 카드 → 상세 이미지 표시를 확인합니다.
