import { clientFetch, refreshAccessToken } from "@/lib/http/client";
import type { AuthUser } from "@/types/auth";

import { mapMemberProfile } from "./mapper";
import {
  accessTokenResponseDto,
  emailVerificationResponseDto,
  loginResponseDto,
  memberProfileResponseDto,
  signupResponseDto,
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

interface RequestEmailVerificationRequest {
  email: string;
}

interface VerifyEmailCodeRequest {
  email: string;
  code: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  /** 순수 숫자 9~20자(예: "01012345678") — BE `MemberSignupRequest.phone` `@Pattern(\d{9,20})`. */
  phone: string;
  role: "USER";
  agreements: {
    age14OrOlder: boolean;
    termsOfService: boolean;
    privacyCollection: boolean;
    /** 선택 — Figma "마케팅 정보 수신"+"이벤트/프로모션 알림" 2개를 이 필드 하나로 합쳐 보낸다.
     * BE `Agreements`엔 이거 하나뿐이고 "개인정보 제3자 제공"에 대응하는 필드는 없다. */
    marketing: boolean;
  };
}

/**
 * `POST /api/member/email-verifications` → 이메일 인증 코드 발송.
 * **placeholder 계약**(design.md §0.1·§7-2) — 실제 BE 엔드포인트는 재전송 전용이고 코드가
 * 아니라 magic-link 방식이다. BE가 코드 입력 방식을 실제로 배포하면 다시 대조해야 한다.
 */
export async function requestEmailVerification(
  body: RequestEmailVerificationRequest,
): Promise<{ expiresInSeconds: number }> {
  const data = await clientFetch<unknown>("/api/member/email-verifications", {
    method: "POST",
    body,
    auth: false,
  });
  return emailVerificationResponseDto.parse(data);
}

/**
 * `POST /api/member/email-verifications/verify` → 이메일 인증 코드 확인.
 * **placeholder 계약**(design.md §0.1·§7-2) — 실제 BE는 `GET .../verify?token=` magic-link라
 * 경로·메서드가 다르다.
 */
export async function verifyEmailCode(
  body: VerifyEmailCodeRequest,
): Promise<void> {
  await clientFetch<null>("/api/member/email-verifications/verify", {
    method: "POST",
    body,
    auth: false,
  });
}

/**
 * `POST /api/member/signup` → 가입 + 자동 로그인. **BE에 요청한 응답 계약을 전제로 한다**
 * (design.md §0.2) — 로그인과 동일하게 `{ accessToken, member }`를 받는다고 가정한다. 실제로
 * 지금 BE가 주는 건 `{ memberId, email, status }`뿐이라(세션 없음) BE가 이 변경을 배포하기
 * 전엔 실제 서버로 가입할 때마다 파싱에 실패한다 — 배포 순서를 BE 완료에 맞춰야 한다.
 */
export async function signup(
  body: SignupRequest,
): Promise<{ accessToken: string; user: AuthUser }> {
  const data = await clientFetch<unknown>("/api/member/signup", {
    method: "POST",
    body,
    auth: false,
  });
  const { accessToken, member } = signupResponseDto.parse(data);
  return { accessToken, user: mapMemberProfile(member) };
}
