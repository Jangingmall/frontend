import { beforeEach, describe, expect, it } from "vitest";

import { __resetRefreshState } from "@/lib/http/client";
import { useAuthStore } from "@/stores/auth";

import {
  completeOAuthProfile,
  fetchMe,
  login,
  logout,
  refreshToken,
  requestEmailVerification,
  signup,
  verifyEmailCode,
} from "./api";
import {
  memberMeArtisan,
  SEED_ACCESS_TOKEN,
  SEED_ACCESS_TOKEN_REFRESHED,
  SEED_LOGIN,
  SEED_VERIFICATION_CODE,
} from "./mock/fixtures";
import {
  __resetEmailVerificationState,
  __resetLoginRateLimit,
} from "./mock/handlers";
import { setMockIdentity } from "./mock/mock-identity";

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
  __resetRefreshState();
  __resetLoginRateLimit();
  __resetEmailVerificationState();
  // fetchMe·refreshToken 테스트는 "이미 로그인 이력이 있다" 전제다 — 명시적으로 깐다(이전엔
  // 앞선 `login()` 테스트가 실행되며 우연히 같은 값을 남겨 통과했을 뿐이었다. §client.test.ts).
  setMockIdentity("USER");
});

describe("member api", () => {
  it("login: 유효 자격 → accessToken + user", async () => {
    await expect(login(SEED_LOGIN)).resolves.toEqual({
      accessToken: SEED_ACCESS_TOKEN,
      user: { id: 1, name: "김미담", role: "USER" },
    });
  });

  it("login: 잘못된 자격 → ApiError 401", async () => {
    await expect(
      login({ email: "wrong@midam.test", password: "nope" }),
    ).rejects.toMatchObject({ name: "ApiError", status: 401 });
  });

  it("login: 필드 누락 → ApiError 400", async () => {
    await expect(login({ email: "", password: "" })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
    });
  });

  it("login: 요청 한도(10회/60초) 초과 → ApiError 429", async () => {
    for (let i = 0; i < 10; i += 1) {
      await login(SEED_LOGIN);
    }
    await expect(login(SEED_LOGIN)).rejects.toMatchObject({
      name: "ApiError",
      status: 429,
    });
  });

  it("fetchMe: 유효 토큰이면 사용자", async () => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
    await expect(fetchMe()).resolves.toEqual({
      id: 1,
      name: "김미담",
      role: "USER",
    });
  });

  it("refreshToken: 새 accessToken", async () => {
    await expect(refreshToken()).resolves.toMatchObject({
      accessToken: SEED_ACCESS_TOKEN_REFRESHED,
    });
  });

  it("logout: 성공적으로 완료된다", async () => {
    await expect(logout()).resolves.toBeUndefined();
  });

  // 이하 3개는 §0.1·§0.2(design.md) — placeholder·BE 요청 반영 전제 계약. MSW로만 검증된다.
  it("requestEmailVerification: 새 이메일이면 유효시간을 반환한다", async () => {
    await expect(
      requestEmailVerification({ email: "newbie@midam.test" }),
    ).resolves.toEqual({ expiresInSeconds: 600 });
  });

  it("requestEmailVerification: 이미 가입된 이메일이면 ApiError 409", async () => {
    await expect(
      requestEmailVerification({ email: SEED_LOGIN.email }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "CONFLICT",
    });
  });

  it("verifyEmailCode: 발송 이력 없이 확인하면 ApiError(인증 만료)", async () => {
    await expect(
      verifyEmailCode({
        email: "newbie@midam.test",
        code: SEED_VERIFICATION_CODE,
      }),
    ).rejects.toMatchObject({ name: "ApiError", status: 410 });
  });

  it("signup: 이메일 인증 완료 후 가입하면 세션(accessToken+user)을 받는다", async () => {
    const email = "newbie@midam.test";
    await requestEmailVerification({ email });
    await verifyEmailCode({ email, code: SEED_VERIFICATION_CODE });

    const result = await signup({
      email,
      password: "Abcd1234!",
      passwordConfirm: "Abcd1234!",
      name: "홍길동",
      phone: "01012345678",
      role: "USER",
      agreements: {
        age14OrOlder: true,
        termsOfService: true,
        privacyCollection: true,
        marketing: false,
      },
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.user).toMatchObject({ name: "홍길동", role: "USER" });
  });

  it("signup 직후 fetchMe는 방금 가입한 회원을 돌려준다(고정 시드 아님)", async () => {
    // 코드 리뷰 발견 — `/me`가 항상 고정 fixture(`memberMeUser`, 이름 "김미담")를 돌려줘서,
    // 가입 직후 새로고침하거나 `/me`를 다시 부르면 방금 입력한 이름·이메일이 사라지고
    // 시드 값으로 보였다. `setDynamicMember`로 `/me`가 실제 가입 회원을 기억하게 고쳤다.
    const email = "freshsignup@midam.test";
    await requestEmailVerification({ email });
    await verifyEmailCode({ email, code: SEED_VERIFICATION_CODE });
    const { accessToken } = await signup({
      email,
      password: "Abcd1234!",
      passwordConfirm: "Abcd1234!",
      name: "이신입",
      phone: "01098765432",
      role: "USER",
      agreements: {
        age14OrOlder: true,
        termsOfService: true,
        privacyCollection: true,
        marketing: false,
      },
    });

    useAuthStore.setState({ accessToken });
    const me = await fetchMe();

    expect(me.name).toBe("이신입");
    expect(me.name).not.toBe("김미담");
  });

  it("signup: 이메일 인증 없이 가입하면 ApiError 403", async () => {
    await expect(
      signup({
        email: "unverified@midam.test",
        password: "Abcd1234!",
        passwordConfirm: "Abcd1234!",
        name: "홍길동",
        phone: "01012345678",
        role: "USER",
        agreements: {
          age14OrOlder: true,
          termsOfService: true,
          privacyCollection: true,
          marketing: false,
        },
      }),
    ).rejects.toMatchObject({ name: "ApiError", status: 403 });
  });

  it("completeOAuthProfile: 새 이메일이면 가입 + 세션(accessToken+user)을 반환한다", async () => {
    const result = await completeOAuthProfile({
      provider: "kakao",
      email: "kakao-newbie@midam.test",
      name: "김소셜",
      phone: "01012345678",
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.user).toMatchObject({ name: "김소셜", role: "USER" });
  });

  it("completeOAuthProfile: 지원하지 않는 provider면 ApiError 400(리뷰 nit)", async () => {
    // 타입상 "naver"|"kakao"만 허용되지만, mock 핸들러가 런타임에도 그 계약을 실제로
    // 지키는지 확인한다 — TS로는 막히는 값을 일부러 흘려보낸다.
    await expect(
      completeOAuthProfile({
        provider: "google" as unknown as "naver",
        email: "google-user@midam.test",
        name: "김소셜",
        phone: "01012345678",
      }),
    ).rejects.toMatchObject({ name: "ApiError", status: 400 });
  });

  it("completeOAuthProfile: 필수 항목이 비어 있으면 ApiError 400", async () => {
    await expect(
      completeOAuthProfile({
        provider: "naver",
        email: "",
        name: "김소셜",
        phone: "01012345678",
      }),
    ).rejects.toMatchObject({ name: "ApiError", status: 400 });
  });

  it("completeOAuthProfile: 이미 가입된 이메일이면 ApiError 409(실제 BE는 연동을 지원하지 않는다)", async () => {
    // BE `OAuthMemberService.requireNewEmail`을 직접 대조해 확인 — 기존 이메일이면
    // "연동"이 아니라 무조건 CONFLICT다(PR 리뷰).
    await expect(
      completeOAuthProfile({
        provider: "kakao",
        email: memberMeArtisan.email,
        name: "다른이름",
        phone: "01099998888",
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "CONFLICT",
    });
  });
});
