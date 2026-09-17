import { beforeEach, describe, expect, it } from "vitest";

import { __resetRefreshState } from "@/lib/http/client";
import { useAuthStore } from "@/stores/auth";

import {
  changePassword,
  completeOAuthProfile,
  createAddress,
  deleteAddress,
  fetchAddresses,
  fetchMe,
  fetchMemberProfile,
  login,
  logout,
  refreshToken,
  requestEmailVerification,
  signup,
  updateAddress,
  updateMemberProfile,
  verifyEmailCode,
  verifyPassword,
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
  resetAddressMock,
} from "./mock/handlers";
import { setMockIdentity } from "./mock/mock-identity";

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
  __resetRefreshState();
  __resetLoginRateLimit();
  __resetEmailVerificationState();
  resetAddressMock();
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

  it("completeOAuthProfile: 네이버는 이메일 인증을 먼저 완료하지 않으면 ApiError 403(리뷰)", async () => {
    // 카카오는 provider가 이미 인증한 이메일을 주지만, 네이버는 `/signup`과 같은 이메일
    // 인증 흐름을 거쳐야 한다 — UI의 `canSubmit` 가드가 아니라 핸들러 자체가 강제해야
    // 한다(이전엔 이 검사가 빠져 있었다).
    await expect(
      completeOAuthProfile({
        provider: "naver",
        email: "naver-unverified@midam.test",
        name: "김소셜",
        phone: "01012345678",
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("일반 가입으로 만든 이메일은 이후 OAuth 완료 요청에서도 이미 가입된 이메일로 취급된다(리뷰)", async () => {
    // `EXISTING_EMAILS`가 가입 시점에 갱신되지 않으면 두 흐름을 넘나들며 같은 이메일로
    // 회원이 두 번 생성될 수 있었다 — signup 성공 후 같은 이메일로 OAuth 완료를 시도해
    // CONFLICT가 나는지 확인한다.
    const email = "cross-flow@midam.test";
    await requestEmailVerification({ email });
    await verifyEmailCode({ email, code: SEED_VERIFICATION_CODE });
    await signup({
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

    await expect(
      completeOAuthProfile({
        provider: "kakao",
        email,
        name: "김소셜",
        phone: "01099998888",
      }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "CONFLICT",
    });
  });
});

describe("member profile·password api", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  });

  it("fetchMemberProfile: email·phone·authProvider까지 포함한 상세 모델을 반환한다", async () => {
    await expect(fetchMemberProfile()).resolves.toMatchObject({
      id: 1,
      name: "김미담",
      email: SEED_LOGIN.email,
      phone: "01011112222",
      authProvider: "local",
      role: "USER",
    });
  });

  it("updateMemberProfile: 이름·휴대전화를 갱신한다", async () => {
    await expect(
      updateMemberProfile({ name: "새이름", phone: "01099998888" }),
    ).resolves.toMatchObject({ name: "새이름", phone: "01099998888" });
  });

  it("changePassword: 현재 비밀번호가 맞으면 성공한다", async () => {
    await expect(
      changePassword({
        currentPassword: SEED_LOGIN.password,
        newPassword: "NewPassw0rd!",
      }),
    ).resolves.toBeUndefined();
  });

  it("changePassword: 현재 비밀번호가 틀리면 ApiError 400", async () => {
    await expect(
      changePassword({
        currentPassword: "wrong-password",
        newPassword: "NewPassw0rd!",
      }),
    ).rejects.toMatchObject({ name: "ApiError", status: 400 });
  });

  it("verifyPassword: 올바른 비밀번호면 true", async () => {
    await expect(
      verifyPassword(SEED_LOGIN.email, SEED_LOGIN.password),
    ).resolves.toBe(true);
  });

  it("verifyPassword: 틀린 비밀번호면 false(throw 안 함)", async () => {
    await expect(
      verifyPassword(SEED_LOGIN.email, "wrong-password"),
    ).resolves.toBe(false);
  });
});

describe("member addresses api", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  });

  it("fetchAddresses: 시드된 배송지 목록을 반환하고 첫 항목이 기본 배송지다", async () => {
    const addresses = await fetchAddresses();
    expect(addresses).toHaveLength(2);
    expect(addresses[0]).toMatchObject({ isDefault: true });
  });

  it("createAddress: 새 배송지를 추가한다", async () => {
    const created = await createAddress({
      recipientName: "홍길동",
      phone: "01055556666",
      zipCode: "12345",
      address1: "서울특별시 종로구 세종대로 1",
      address2: "1층",
      isDefault: false,
    });
    expect(created).toMatchObject({
      recipientName: "홍길동",
      isDefault: false,
    });

    const addresses = await fetchAddresses();
    expect(addresses).toHaveLength(3);
  });

  it("createAddress: isDefault로 만들면 기존 기본 배송지가 해제된다", async () => {
    const [first] = await fetchAddresses();
    const created = await createAddress({
      recipientName: "홍길동",
      phone: "01055556666",
      zipCode: "12345",
      address1: "서울특별시 종로구 세종대로 1",
      address2: "1층",
      isDefault: true,
    });
    expect(created.isDefault).toBe(true);

    const addresses = await fetchAddresses();
    expect(addresses.find((a) => a.id === first.id)?.isDefault).toBe(false);
  });

  it("updateAddress: 부분 필드만 갱신한다", async () => {
    const [first] = await fetchAddresses();
    const updated = await updateAddress(first.id, { address2: "새 상세주소" });
    expect(updated).toMatchObject({
      id: first.id,
      recipientName: first.recipientName,
      address2: "새 상세주소",
    });
  });

  it("updateAddress: 존재하지 않는 id면 ApiError 404", async () => {
    await expect(
      updateAddress(999999, { address2: "x" }),
    ).rejects.toMatchObject({ name: "ApiError", status: 404 });
  });

  it("updateAddress: 마지막 기본 배송지를 해제하려 하면 ApiError 422", async () => {
    const addresses = await fetchAddresses();
    // 시드가 2건이라 하나를 지워 "마지막 1건" 상태를 만든다.
    await deleteAddress(addresses[1].id);
    const [remaining] = await fetchAddresses();

    await expect(
      updateAddress(remaining.id, { isDefault: false }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      code: "BUSINESS_RULE_VIOLATION",
    });
  });

  it("deleteAddress: 삭제 후 목록에서 사라지고, 기본 배송지였으면 다음 항목이 승격된다", async () => {
    const [first] = await fetchAddresses();
    expect(first.isDefault).toBe(true);

    await deleteAddress(first.id);

    const addresses = await fetchAddresses();
    expect(addresses).toHaveLength(1);
    expect(addresses[0].isDefault).toBe(true);
  });

  it("deleteAddress: 존재하지 않는 id면 ApiError 404", async () => {
    await expect(deleteAddress(999999)).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
    });
  });
});
