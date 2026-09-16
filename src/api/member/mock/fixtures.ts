import type { MemberProfileResponseDto } from "@/api/member/validation";
import type { Role } from "@/types/auth";

/**
 * 회원·인증 mock 데이터. 실제 검증 스키마(`memberProfileResponseDto`)로 테스트에서 검증해
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

/** 회원가입 mock 전용 시드. (design.md §6 — 코드 인증 2개는 placeholder 계약, signup은
 * BE 요청 반영 전제 계약) */
export const SEED_VERIFICATION_CODE = "123456";
/** 가입 성공 시 발급되는 access token(로그인 시드와 같은 접두사라 `/me`도 그대로 인정). */
export const SEED_SIGNUP_ACCESS_TOKEN = "mock-access-token-signup";
/** 소셜 로그인/가입 성공 시 발급되는 access token(같은 이유로 같은 접두사 공유). */
export const SEED_OAUTH_ACCESS_TOKEN = "mock-access-token-oauth";

export const memberMeUser: MemberProfileResponseDto = {
  memberId: 1,
  email: SEED_LOGIN.email,
  name: "김미담",
  nickname: "미담이",
  role: "USER",
  profileImageUrl: null,
};

/** 판매자 변형 — 기본 핸들러엔 안 물리고, 테스트가 `server.use`로 교체해 role 분기를 본다. */
export const memberMeArtisan: MemberProfileResponseDto = {
  memberId: 2,
  email: "artisan@midam.test",
  name: "이공방",
  nickname: "이공방",
  role: "ARTISAN",
  profileImageUrl: null,
};

/** 관리자 변형 — `memberMeArtisan`과 같은 용도. */
export const memberMeAdmin: MemberProfileResponseDto = {
  memberId: 3,
  email: "admin@midam.test",
  name: "관리자",
  nickname: "관리자",
  role: "ADMIN",
  profileImageUrl: null,
};

/**
 * `Role` → 고정 mock 프로필. `mock/handlers.ts`의 `/me`와 `app/mock-identity-switcher.tsx`
 * ("리모컨")가 공유한다 — 신원별 fixture를 두 곳에서 따로 나열하지 않는다.
 */
export const mockIdentityFixtures = {
  USER: memberMeUser,
  ARTISAN: memberMeArtisan,
  ADMIN: memberMeAdmin,
} as const satisfies Record<Role, MemberProfileResponseDto>;
