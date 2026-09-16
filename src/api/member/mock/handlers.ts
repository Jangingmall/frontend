import { type DefaultBodyType, http, type PathParams } from "msw";

import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import {
  memberMeAdmin,
  memberMeArtisan,
  memberMeUser,
  mockIdentityFixtures,
  SEED_ACCESS_TOKEN,
  SEED_ACCESS_TOKEN_PREFIX,
  SEED_ACCESS_TOKEN_REFRESHED,
  SEED_LOGIN,
  SEED_SIGNUP_ACCESS_TOKEN,
  SEED_VERIFICATION_CODE,
} from "./fixtures";
import { getMockIdentity, setMockIdentity } from "./mock-identity";

/**
 * 회원·인증 MSW 핸들러. `src/mocks/handlers.ts`에 등록된다.
 * 로그인 응답에 `member`가 포함된다(경우 A) — BE `MemberLoginResponse`와 동일.
 *
 * 성공·실패 봉투를 함께 반환하므로 응답 body 제네릭을 명시한다(안 그러면 첫 return 으로
 * 좁혀져 다른 분기가 타입 에러).
 */
type Envelope = ApiResponse<unknown> | ApiErrorResponse;

/**
 * `POST /login` rate limit mock. 실제 BE `AuthRateLimiter`(IP+URI 기준, 기본 10회/60초,
 * 성공·실패 무관)를 단순화해 흉내 낸다 — 브라우저 mock엔 실제 IP 개념이 없어 **핸들러 전체
 * 호출 횟수** 기준으로만 카운트한다(이메일별 아님). 자격 검증보다 먼저 체크해 BE의 인터셉터
 * 순서(컨트롤러 진입 전)와 맞춘다.
 */
const RATE_LIMIT_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
let requestCount = 0;
let windowStartedAt = Date.now();

/** 테스트 전용 — 모듈 스코프 rate limit 상태를 비운다. */
export function __resetLoginRateLimit(): void {
  requestCount = 0;
  windowStartedAt = Date.now();
}

/**
 * 이메일 인증 mock 상태. **placeholder 계약**(design.md §0.1·§7-2) — 실제 BE 엔드포인트가
 * 아니라, BE가 코드 입력 방식으로 바꿔줄 거라 전제하고 지어낸 흐름을 흉내 낸다.
 * `verificationExpiresInSeconds` 이내에 `verify`를 부르지 않으면 만료 처리한다.
 */
const VERIFICATION_TTL_MS = 600 * 1000;
const EXISTING_EMAILS = new Set(
  [SEED_LOGIN.email, memberMeArtisan.email, memberMeAdmin.email].map((email) =>
    email.toLowerCase(),
  ),
);
const emailVerificationState = new Map<
  string,
  { sentAt: number; verified: boolean }
>();
let nextSignupMemberId = 100;

/** 테스트 전용 — 모듈 스코프 이메일 인증 상태를 비운다. */
export function __resetEmailVerificationState(): void {
  emailVerificationState.clear();
  nextSignupMemberId = 100;
}

export const memberHandlers = [
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/login",
    async ({ request }) => {
      const now = Date.now();
      if (now - windowStartedAt > RATE_LIMIT_WINDOW_MS) {
        requestCount = 0;
        windowStartedAt = now;
      }
      requestCount += 1;
      if (requestCount > RATE_LIMIT_ATTEMPTS) {
        return mockError(429, "TOO_MANY_REQUESTS", "요청 한도를 초과했습니다");
      }

      const body = (await request.json().catch(() => null)) as {
        email?: string;
        password?: string;
      } | null;

      if (!body?.email || !body?.password) {
        return mockError(400, "INVALID_INPUT", "email·password가 필요합니다.");
      }
      if (
        body.email !== SEED_LOGIN.email ||
        body.password !== SEED_LOGIN.password
      ) {
        return mockError(
          401,
          "UNAUTHORIZED",
          "이메일 또는 비밀번호가 올바르지 않습니다.",
        );
      }
      // SEED_LOGIN은 항상 memberMeUser(USER)에 대응한다 — "리모컨"으로 다른 신원을 골랐어도
      // 실제 로그인 폼을 통과하면 그 선택을 덮어쓰고 USER로 되돌린다(실제 로그인 흐름과 동일).
      setMockIdentity("USER");
      return mockOk({ accessToken: SEED_ACCESS_TOKEN, member: memberMeUser });
    },
  ),

  http.get<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/me",
    ({ request }) => {
      const authorization = request.headers.get("Authorization") ?? "";
      if (!authorization.startsWith(`Bearer ${SEED_ACCESS_TOKEN_PREFIX}`)) {
        return mockError(401, "UNAUTHORIZED");
      }
      const identity = getMockIdentity();
      if (identity === "anonymous") return mockError(401, "UNAUTHORIZED");
      return mockOk(mockIdentityFixtures[identity]);
    },
  ),

  // `getMockIdentity()`가 "anonymous"(로그인 이력 없음·로그아웃 — 기본값)면 401. `/login`
  // 성공·"리모컨"(`mock-identity.ts`)으로 다른 신원을 고르면 그때부터 성공한다.
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/token/refresh",
    () => {
      if (getMockIdentity() === "anonymous") {
        return mockError(401, "UNAUTHORIZED");
      }
      return mockOk({ accessToken: SEED_ACCESS_TOKEN_REFRESHED });
    },
  ),

  http.post("*/api/member/logout", () => {
    setMockIdentity("anonymous");
    return mockOk(null);
  }),

  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/email-verifications",
    async ({ request }) => {
      const body = (await request.json().catch(() => null)) as {
        email?: string;
      } | null;
      const email = body?.email?.toLowerCase();
      if (!email) {
        return mockError(400, "INVALID_INPUT", "email이 필요합니다.");
      }
      if (EXISTING_EMAILS.has(email)) {
        return mockError(409, "CONFLICT", "이미 가입된 이메일이에요.");
      }
      emailVerificationState.set(email, {
        sentAt: Date.now(),
        verified: false,
      });
      return mockOk({ expiresInSeconds: VERIFICATION_TTL_MS / 1000 });
    },
  ),

  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/email-verifications/verify",
    async ({ request }) => {
      const body = (await request.json().catch(() => null)) as {
        email?: string;
        code?: string;
      } | null;
      const email = body?.email?.toLowerCase();
      if (!email || !body?.code) {
        return mockError(400, "INVALID_INPUT", "email·code가 필요합니다.");
      }
      const state = emailVerificationState.get(email);
      if (!state || Date.now() - state.sentAt > VERIFICATION_TTL_MS) {
        return mockError(410, "RESOURCE_EXPIRED", "인증 시간이 지났습니다.");
      }
      if (body.code !== SEED_VERIFICATION_CODE) {
        return mockError(400, "INVALID_INPUT", "인증코드가 올바르지 않아요.");
      }
      emailVerificationState.set(email, { ...state, verified: true });
      return mockOk(null);
    },
  ),

  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/signup",
    async ({ request }) => {
      const body = (await request.json().catch(() => null)) as {
        email?: string;
        name?: string;
      } | null;
      const email = body?.email?.toLowerCase();
      if (!email || !body?.name) {
        return mockError(400, "INVALID_INPUT", "필수 항목이 비어 있어요.");
      }
      if (EXISTING_EMAILS.has(email)) {
        return mockError(409, "CONFLICT", "이미 가입된 이메일이에요.");
      }
      if (!emailVerificationState.get(email)?.verified) {
        return mockError(403, "FORBIDDEN", "이메일 인증을 먼저 완료해주세요.");
      }
      const member = {
        memberId: nextSignupMemberId++,
        email: body.email,
        name: body.name,
        nickname: null,
        role: "USER" as const,
        profileImageUrl: null,
      };
      setMockIdentity("USER");
      return mockOk({ accessToken: SEED_SIGNUP_ACCESS_TOKEN, member }, 201);
    },
  ),
];
