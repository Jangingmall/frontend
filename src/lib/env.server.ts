import "server-only";

/**
 * 런타임 서버 env. `server-only`가 클라이언트 번들 유입 시 빌드를 실패시킨다.
 * 모듈 로드 시 스키마 parse를 하지 않는다 — 값 부재 검증은 각 호출부의 lazy 가드
 * (예: `fetcher`의 `API_BASE_URL` 필수 체크, revalidate route의 시크릿 체크).
 * (docs/data-layer.md §9)
 */
export const serverEnv = {
  apiBaseUrl: process.env.API_BASE_URL ?? "",
  revalidateWebhookSecret: process.env.REVALIDATE_WEBHOOK_SECRET ?? "",
} as const;
