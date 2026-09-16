import { publicEnv } from "@/lib/env";

/**
 * Next.js가 서버 인스턴스 부팅 시 1회 호출한다(요청 처리 전 완료). (Next.js 규약)
 *
 * 목업 플래그가 켜져 있으면 여기서 MSW node 서버를 띄워, 서버(RSC/ISR) fetch가
 * 실제 백엔드 대신 도메인 핸들러 응답을 받게 한다. `next dev`·`next start`·`next build`
 * 부팅 경로에 모두 걸린다. (§docs/data-layer.md §2.2 — 공개 데이터는 서버에서 조회)
 *
 * **Vercel 실제 production 배포면 플래그가 켜져 있어도 목업을 띄우지 않는다**
 * (`publicEnv.isVercelProduction`) — 목업은 "어떤 mock 유저로든 로그인 가능"한 상태라
 * (예: `admin@midam.test`만 알면 ADMIN 신원 획득), 실수로 배포 환경 변수에
 * `NEXT_PUBLIC_API_MOCKING=enabled`가 남아 있어도 외부에 노출되지 않도록 여기서 한 번 더
 * 막는다(PR 리뷰 — CodeRabbit Security Review). `NODE_ENV === "production"`으로 먼저
 * 막았다가 CI E2E(`npm run build && npm run start`, 의도적으로 목업 켬)까지 걸려 전부
 * 실패한 적이 있다 — `NODE_ENV`는 "빌드 모드"일 뿐 "어디에 떠 있는가"가 아니라서
 * `isVercelProduction`으로 바꿨다.
 */
export async function register() {
  if (publicEnv.isVercelProduction) return;
  // `msw/node`는 Node 전용 — Edge 런타임에서 import하면 파손된다. 동적 import로
  // Node 부팅에서만 로드한다.
  if (publicEnv.apiMocking && process.env.NEXT_RUNTIME === "nodejs") {
    const { server } = await import("@/mocks/server");
    server.listen({ onUnhandledRequest: "bypass" });
  }
}
