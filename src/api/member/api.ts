import { clientFetch, refreshAccessToken } from "@/lib/http/client";
import type { AuthUser } from "@/types/auth";

import { mapMemberMe } from "./mapper";
import { accessTokenResponseDto, memberMeResponseDto } from "./validation";

/**
 * 회원·인증 도메인 API 함수. (docs/api-contract.md "회원·인증")
 *
 * 세션 오케스트레이션(로그인 후 `me` 연쇄, `stores/auth` 갱신)은 여기가 아니라
 * 앱 부팅(`app/auth-bootstrap.tsx`)·이후 로그인 훅이 한다 — api 계층은 store에 의존하지
 * 않는다(docs/architecture.md §8.2).
 */

interface LoginRequest {
  email: string;
  password: string;
}

/** `POST /api/member/login` → access token(경우 B — user는 이어서 `fetchMe`로). */
export async function login(
  body: LoginRequest,
): Promise<{ accessToken: string }> {
  const data = await clientFetch<unknown>("/api/member/login", {
    method: "POST",
    body,
    auth: false,
  });
  return accessTokenResponseDto.parse(data);
}

/** `GET /api/member/me` → 로그인 사용자. Bearer 필요. */
export async function fetchMe(): Promise<AuthUser> {
  const data = await clientFetch<unknown>("/api/member/me");
  return mapMemberMe(memberMeResponseDto.parse(data));
}

/**
 * `POST /api/member/token/refresh` → 새 access token.
 * fetch·single-flight는 `lib/http/client`의 primitive에 위임하고 여기선 계약 검증만 얹는다.
 */
export async function refreshToken(): Promise<{ accessToken: string }> {
  return accessTokenResponseDto.parse({
    accessToken: await refreshAccessToken(),
  });
}

/** `POST /api/member/logout` — 서버 refresh 무효화. */
export async function logout(): Promise<void> {
  await clientFetch<null>("/api/member/logout", { method: "POST" });
}
