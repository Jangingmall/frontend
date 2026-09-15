import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // same-origin API 프록시. FE·BE가 같은 출처로 보이도록 `/api/*`를 백엔드로 넘긴다
  // (docs/routing-and-auth.md §4.3·§7 — 코드로 된 BFF가 아니라 투명한 passthrough).
  // `/oauth2/*`도 함께 넘긴다 — Spring Security의 OAuth2 로그인 시작 경로
  // (`/oauth2/authorization/{provider}`)가 `/api` 밖에 있어, 이것도 안 넘기면 same-origin
  // 구조에서 카카오·구글 로그인 리다이렉트가 프론트 자체 라우팅으로 떨어져 404가 난다.
  //
  // `API_BASE_URL`이 아직 실제 백엔드 도메인이 아니다(로컬은 목업용 더미 값 — MSW가 요청을
  // 가로채므로 값 자체는 도달하지 않는다. docs/routing-and-auth.md §9 "인프라 도메인 확정
  // 후 설정"). 도메인이 정해지면 이 파일은 더 손댈 필요 없이 env 값만 채우면 된다.
  //
  // 플랫 배열 반환은 Next.js `afterFiles` 순서로 적용된다 — 실제 파일시스템 라우트
  // (`src/app/api/revalidate/route.ts`, ISR webhook)가 먼저 매칭되고 나머지만 여기로
  // 넘어와 기존 webhook과 충돌하지 않는다.
  async rewrites() {
    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl) return [];
    return [
      { source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` },
      { source: "/oauth2/:path*", destination: `${apiBaseUrl}/oauth2/:path*` },
    ];
  },
};

export default nextConfig;
