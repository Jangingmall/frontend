import { http } from "msw";
import { afterEach, expect, it } from "vitest";

import { publicEnv } from "@/lib/env";
import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import {
  completeOAuthProfile,
  requestEmailVerification,
  signup,
  verifyEmailCode,
} from "./api";

afterEach(() => Object.assign(publicEnv, { apiMocking: true }));

it("accepts a pending signup without creating a login token", async () => {
  Object.assign(publicEnv, { apiMocking: false });
  server.use(
    http.post("*/api/member/signup", () =>
      mockOk({
        accessToken: null,
        member: {
          memberId: 19,
          email: "buyer@example.com",
          name: "구매자",
          nickname: null,
          role: "USER",
          profileImageUrl: null,
          provider: null,
        },
      }),
    ),
  );
  const result = await signup({
    email: "buyer@example.com",
    password: "Password1!",
    passwordConfirm: "Password1!",
    name: "구매자",
    phone: "01012345678",
    role: "USER",
    agreements: {
      age14OrOlder: true,
      termsOfService: true,
      privacyCollection: true,
      marketing: false,
    },
  });
  expect(result.accessToken).toBeNull();
  expect(result.user.id).toBe(19);
});

it("sends OAuth agreements without client supplied identity", async () => {
  Object.assign(publicEnv, { apiMocking: false });
  let body: unknown;
  server.use(
    http.post("*/api/member/oauth2/complete-profile", async ({ request }) => {
      body = await request.json();
      return mockOk({
        memberId: 19,
        email: "buyer@example.com",
        role: "USER",
        accessToken: "session",
        provider: "naver",
      });
    }),
  );
  await completeOAuthProfile({
    provider: "naver",
    email: "ignored@example.com",
    name: "구매자",
    phone: "01012345678",
    agreements: {
      age14OrOlder: true,
      termsOfService: true,
      privacyCollection: true,
      marketing: false,
    },
  });
  expect(body).toEqual({
    name: "구매자",
    phone: "01012345678",
    agreements: {
      age14OrOlder: true,
      termsOfService: true,
      privacyCollection: true,
      marketing: false,
    },
  });
});

it("실제 인증코드 발송의 null 응답을 5분 타이머로 연결한다", async () => {
  Object.assign(publicEnv, { apiMocking: false });
  let body: unknown;
  server.use(
    http.post("*/api/member/email/verification-code", async ({ request }) => {
      body = await request.json();
      return mockOk(null);
    }),
  );
  expect(
    await requestEmailVerification({ email: "buyer@example.com" }),
  ).toEqual({ expiresInSeconds: 300 });
  expect(body).toEqual({ email: "buyer@example.com" });
});
it("실제 이메일 인증 확인은 email/verify로 코드와 이메일을 전송한다", async () => {
  Object.assign(publicEnv, { apiMocking: false });
  let body: unknown;
  server.use(
    http.post("*/api/member/email/verify", async ({ request }) => {
      body = await request.json();
      return mockOk(null);
    }),
  );
  await verifyEmailCode({ email: "buyer@example.com", code: "123456" });
  expect(body).toEqual({ email: "buyer@example.com", code: "123456" });
});
