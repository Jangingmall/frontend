import { publicEnv } from "@/lib/env";

/**
 * Next.js가 서버 인스턴스 부팅 시 1회 호출한다(요청 처리 전 완료). (Next.js 규약)
 *
 * 목업 플래그가 켜져 있으면 여기서 MSW node 서버를 띄워, 서버(RSC/ISR) fetch가
 * 실제 백엔드 대신 도메인 핸들러 응답을 받게 한다. `next dev`·`next start`·`next build`
 * 부팅 경로에 모두 걸린다. (§docs/data-layer.md §2.2 — 공개 데이터는 서버에서 조회)
 */
export async function register() {
  // `msw/node`는 Node 전용 — Edge 런타임에서 import하면 파손된다. 동적 import로
  // Node 부팅에서만 로드한다.
  if (publicEnv.apiMocking && process.env.NEXT_RUNTIME === "nodejs") {
    const { server } = await import("@/mocks/server");
    server.listen({ onUnhandledRequest: "bypass" });
  }
}
