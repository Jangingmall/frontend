import { clientFetch, refreshAccessToken } from "@/lib/http/client";
import type { AuthUser } from "@/types/auth";

import { mapMemberProfile } from "./mapper";
import {
  accessTokenResponseDto,
  loginResponseDto,
  memberProfileResponseDto,
} from "./validation";

/**
 * 회원·인증 도메인 API 함수. (docs/api-contract.md "회원·인증")
 *
 * 세션 오케스트레이션(로그인 후 store 갱신)은 여기가 아니라 화면 조합 코드
 * (`app/auth-bootstrap.tsx`, 로그인 화면)가 한다 — api 계층은 store에 의존하지
 * 않는다(docs/architecture.md §8.2).
 */

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * `POST /api/member/login` → access token + 로그인 사용자.
 * 로그인 응답에 `member`가 이미 포함돼(경우 A) `GET /me` 후속 호출이 필요 없다 — BE 레포
 * `MemberLoginResponse`를 직접 대조해 확인.
 */
export async function login(
  body: LoginRequest,
): Promise<{ accessToken: string; user: AuthUser }> {
  const data = await clientFetch<unknown>("/api/member/login", {
    method: "POST",
    body,
    auth: false,
  });
  const { accessToken, member } = loginResponseDto.parse(data);
  return { accessToken, user: mapMemberProfile(member) };
}

/**
 * `GET /api/member/me` → 로그인 사용자. Bearer 필요.
 * 부팅 silent refresh(`refresh → GET /me`)가 여전히 쓴다 — `POST /token/refresh` 응답엔
 * `member`가 없다.
 */
export async function fetchMe(): Promise<AuthUser> {
  const data = await clientFetch<unknown>("/api/member/me");
  return mapMemberProfile(memberProfileResponseDto.parse(data));
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
