import { type DefaultBodyType, http, type PathParams } from "msw";

import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import {
  memberMeUser,
  SEED_ACCESS_TOKEN,
  SEED_ACCESS_TOKEN_PREFIX,
  SEED_ACCESS_TOKEN_REFRESHED,
  SEED_LOGIN,
} from "./fixtures";

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
      return mockOk(memberMeUser);
    },
  ),

  // 기본은 성공. refresh 실패 시나리오는 테스트가 `server.use`로 401을 덮어 검증한다.
  http.post("*/api/member/token/refresh", () =>
    mockOk({ accessToken: SEED_ACCESS_TOKEN_REFRESHED }),
  ),

  http.post("*/api/member/logout", () => mockOk(null)),
];
