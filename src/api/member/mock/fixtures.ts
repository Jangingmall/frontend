import type { MemberMeResponseDto } from "@/api/member/validation";

/**
 * 회원·인증 mock 데이터. 실제 검증 스키마(`memberMeResponseDto`)로 테스트에서 검증해
 * mock ↔ 계약 일치를 보장한다. (docs/data-layer.md §4.3)
 *
 * 결정적 값 — 랜덤·시간에 의존하지 않는다(`src/mocks/seed.ts` 스타일).
 */

/** 로그인 성공 시 발급되는 access token. */
export const SEED_ACCESS_TOKEN = "mock-access-token";
/** `POST /token/refresh` 성공 시 발급되는 새 access token. */
export const SEED_ACCESS_TOKEN_REFRESHED = "mock-access-token-refreshed";

/** `GET /me`가 유효 토큰으로 인정하는 접두사(로그인·refresh 토큰 공통). */
export const SEED_ACCESS_TOKEN_PREFIX = "mock-access-token";

/** 유효한 로그인 자격. 이 조합이 아니면 mock login은 401. */
export const SEED_LOGIN = {
  email: "user@midam.test",
  password: "midam1234",
};

export const memberMeUser: MemberMeResponseDto = {
  id: 1,
  name: "김미담",
  roles: ["USER"],
};

/** 판매자 변형 — 기본 핸들러엔 안 물리고, 테스트가 `server.use`로 교체해 role 분기를 본다. */
export const memberMeArtisan: MemberMeResponseDto = {
  id: 2,
  name: "이공방",
  roles: ["USER", "ARTISAN"],
};
