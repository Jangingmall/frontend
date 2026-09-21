import { publicEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/api-error";
import { clientFetch, refreshAccessToken } from "@/lib/http/client";
import type { AuthUser, OAuthProvider } from "@/types/auth";
import type {
  Address,
  AddressInput,
  MemberProfile,
  MemberSettings,
} from "@/types/member";

import {
  mapAddress,
  mapMemberDetail,
  mapMemberProfile,
  mapMemberSettings,
} from "./mapper";
import { SEED_OAUTH_ACCESS_TOKEN } from "./mock/fixtures";
import {
  getMockOAuthLinkedMember,
  setDynamicMember,
  setMockIdentity,
} from "./mock/mock-identity";
import {
  accessTokenResponseDto,
  addressListResponseDto,
  addressResponseDto,
  emailVerificationResponseDto,
  loginResponseDto,
  memberProfileResponseDto,
  memberSettingsResponseDto,
  oauthCompleteProfileResponseDto,
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

export type OAuthLoginResult =
  | { outcome: "authenticated"; accessToken: string; user: AuthUser }
  | {
      outcome: "needsProfile";
      provider: OAuthProvider;
      suggestedEmail: string | null;
    };

/**
 * 소셜 로그인 시작 — 목업 전용. 실제 흐름은 전체 페이지 리다이렉트(`GET
 * /api/member/oauth2/{provider}` → 302로 Spring Security `/oauth2/authorization/{provider}`
 * → 동의 화면 → BE 콜백 → 쿠키 기반 티켓 교환)라 fetch 왕복으로 재현할 방법이 없다. 이
 * 함수는 그 전체를 클라이언트에서 한 번에 흉내낸다 — 이 provider로 이미 연동을 완료한 적
 * 있으면 즉시 로그인, 처음이면 추가정보 입력이 필요하다는 결과를 돌려준다. 실제 백엔드
 * 도메인이 정해지면 이 함수를 지우고 호출부를 `<a href="/api/member/oauth2/{provider}">`로
 * 교체한다 — 시작 경로 자체는 BE 소스(`OAuthController`) 직접 대조로 확인됐다. 다만 그
 * 뒤 단계(추가정보 제출)의 요청·응답 계약은 이 목업과 다르다 — `docs/api-contract.md` §9
 * "OAuth 목업·실제 계약 괴리" 참고.
 */
export async function startMockOAuthLogin(
  provider: OAuthProvider,
): Promise<OAuthLoginResult> {
  if (!publicEnv.apiMocking) {
    throw new Error("소셜 로그인은 아직 준비 중입니다.");
  }

  const linked = getMockOAuthLinkedMember(provider);
  if (linked) {
    setMockIdentity(linked.role);
    setDynamicMember(linked);
    return {
      outcome: "authenticated",
      accessToken: SEED_OAUTH_ACCESS_TOKEN,
      user: mapMemberProfile(linked),
    };
  }

  // IA의 두 분기를 provider별로 하나씩 재현한다: 카카오는 항상 인증된 이메일을 제공해
  // 이메일 인증 단계를 생략하고, 네이버는 이메일을 제공하지 않아 직접 입력·인증이
  // 필요하다. 실제 제공자·BE 계약이 확정되기 전까지의 목업 전용 가정이다.
  const suggestedEmail =
    provider === "kakao" ? `kakao-${Date.now()}@midam.test` : null;
  return { outcome: "needsProfile", provider, suggestedEmail };
}

export interface CompleteOAuthProfileRequest {
  provider: OAuthProvider;
  email: string;
  name: string;
  phone: string;
}

/**
 * `POST /api/member/oauth2/complete-profile` → 소셜 추가정보 제출, 가입 + 자동 로그인.
 * 응답엔 `name`이 없다(`validation.ts`의 `oauthCompleteProfileResponseDto` 주석 참고) —
 * 방금 폼에서 받은 `body.name`을 그대로 쓴다. `login()`·`signup()`과 호출 형태를
 * 맞추기 위해 반환 타입은 동일하게 `{ accessToken, user }`로 둔다.
 */
export async function completeOAuthProfile(
  body: CompleteOAuthProfileRequest,
): Promise<{ accessToken: string; user: AuthUser }> {
  const data = await clientFetch<unknown>(
    "/api/member/oauth2/complete-profile",
    { method: "POST", body, auth: false },
  );
  const { accessToken, memberId, role } =
    oauthCompleteProfileResponseDto.parse(data);
  return {
    accessToken,
    user: { id: memberId, name: body.name, role },
  };
}

/** `GET /api/member/me` → 마이페이지 상세 모델. `fetchMe()`(auth 부팅용)와 같은 엔드포인트를
 * 다른 매퍼로 호출한다 — 상태 경계가 달라(store vs Query 캐시) 독립적으로 조회한다. */
export async function fetchMemberProfile(): Promise<MemberProfile> {
  const data = await clientFetch<unknown>("/api/member/me");
  return mapMemberDetail(memberProfileResponseDto.parse(data));
}

export interface UpdateMemberProfileRequest {
  name: string;
  phone: string;
}

/** `PATCH /api/member/me` → 이름·휴대전화만 갱신한다. 이메일은 BE에 변경 API가 없어 요청에
 * 넣지 않는다(`MemberAccountRequests.Profile`엔 email 필드 자체가 없음). */
export async function updateMemberProfile(
  body: UpdateMemberProfileRequest,
): Promise<MemberProfile> {
  const data = await clientFetch<unknown>("/api/member/me", {
    method: "PATCH",
    body,
  });
  return mapMemberDetail(memberProfileResponseDto.parse(data));
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * `PATCH /api/member/me/password`. BE 요청 바디엔 `newPasswordConfirm`이 없다 — 새 비밀번호
 * 확인은 클라이언트 Zod로만 검증하고 API엔 보내지 않는다.
 *
 * `retryOn401: false` — 이 엔드포인트의 401은 토큰 만료가 아니라 현재 비밀번호 불일치일
 * 가능성이 크다(실제 백엔드가 API 명세의 `400 MISMATCH` 대신 `401`을 반환하는 상태,
 * CodeRabbit 리뷰로 발견). 기본 401 처리를 그대로 두면 비밀번호 오타 하나로 불필요한
 * refresh가 돌고, 실패 시 세션까지 끊긴다 — 호출부(`PasswordChangeTab`)가 401과
 * `MISMATCH`를 모두 "현재 비밀번호 불일치"로 다뤄, 백엔드가 나중에 명세대로 고쳐져도
 * 그대로 맞는다.
 */
export async function changePassword(
  body: ChangePasswordRequest,
): Promise<void> {
  await clientFetch<null>("/api/member/me/password", {
    method: "PATCH",
    body,
    retryOn401: false,
  });
}

/**
 * 비밀번호 재확인. 전용 엔드포인트가 없어 `login()`을 재사용해 검증만 하고 응답(새 토큰)은
 * 버린다(세션 갱신 안 함) — 401이면 불일치로 판단해 `false`, 그 외 실패는 그대로 전파한다.
 */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    await login({ email, password });
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false;
    throw error;
  }
}

/** `GET /api/member/me/addresses` → 페이지네이션 없는 배열(BE `AddressController.list()` 대조 확인). */
export async function fetchAddresses(): Promise<Address[]> {
  const data = await clientFetch<unknown>("/api/member/me/addresses");
  return addressListResponseDto.parse(data).map(mapAddress);
}

/** `POST /api/member/me/addresses` → 생성된 배송지. */
export async function createAddress(input: AddressInput): Promise<Address> {
  const data = await clientFetch<unknown>("/api/member/me/addresses", {
    method: "POST",
    body: input,
  });
  return mapAddress(addressResponseDto.parse(data));
}

/**
 * `PATCH /api/member/me/addresses/{addressId}` → 갱신된 배송지. 부분 업데이트라
 * `input`은 일부 필드만 담을 수 있다 — 목록 카드의 "기본 배송지로 설정" 액션도
 * `{ isDefault: true }`만 담아 이 함수로 호출한다.
 */
export async function updateAddress(
  addressId: number,
  input: Partial<AddressInput>,
): Promise<Address> {
  const data = await clientFetch<unknown>(
    `/api/member/me/addresses/${addressId}`,
    { method: "PATCH", body: input },
  );
  return mapAddress(addressResponseDto.parse(data));
}

/** `DELETE /api/member/me/addresses/{addressId}`. */
export async function deleteAddress(addressId: number): Promise<void> {
  await clientFetch<null>(`/api/member/me/addresses/${addressId}`, {
    method: "DELETE",
  });
}

/** `GET /api/member/settings`. */
export async function fetchSettings(): Promise<MemberSettings> {
  const data = await clientFetch<unknown>("/api/member/settings");
  return mapMemberSettings(memberSettingsResponseDto.parse(data));
}

/** `PATCH /api/member/settings` — 부분 갱신(BE `Settings(Boolean, Boolean)`이 둘 다
 * optional이라 바뀐 값만 보내면 된다). */
export async function updateSettings(
  input: Partial<MemberSettings>,
): Promise<MemberSettings> {
  const data = await clientFetch<unknown>("/api/member/settings", {
    method: "PATCH",
    body: input,
  });
  return mapMemberSettings(memberSettingsResponseDto.parse(data));
}
