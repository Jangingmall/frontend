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
 * 경우 B(토큰만) 가정 — login·refresh는 `{ accessToken }`만 주고 user는 `GET /me`로.
 *
 * 성공·실패 봉투를 함께 반환하므로 응답 body 제네릭을 명시한다(안 그러면 첫 return 으로
 * 좁혀져 다른 분기가 타입 에러).
 */
type Envelope = ApiResponse<unknown> | ApiErrorResponse;

export const memberHandlers = [
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/login",
    async ({ request }) => {
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
      return mockOk({ accessToken: SEED_ACCESS_TOKEN });
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
