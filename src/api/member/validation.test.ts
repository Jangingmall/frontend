import { describe, expect, it } from "vitest";

import {
  memberMeArtisan,
  memberMeUser,
  SEED_ACCESS_TOKEN,
} from "./mock/fixtures";
import {
  accessTokenResponseDto,
  emailVerificationResponseDto,
  loginResponseDto,
  memberProfileResponseDto,
  signupResponseDto,
} from "./validation";

describe("accessTokenResponseDto", () => {
  it("accessToken 문자열을 통과시킨다", () => {
    expect(accessTokenResponseDto.parse({ accessToken: "abc" })).toMatchObject({
      accessToken: "abc",
    });
  });

  it("빈 문자열·누락은 거부한다", () => {
    expect(accessTokenResponseDto.safeParse({ accessToken: "" }).success).toBe(
      false,
    );
    expect(accessTokenResponseDto.safeParse({}).success).toBe(false);
  });

  it("BE가 필드를 더 줘도 passthrough로 보존한다", () => {
    expect(
      accessTokenResponseDto.parse({ accessToken: "a", user: { id: 1 } }),
    ).toMatchObject({ user: { id: 1 } });
  });
});

describe("memberProfileResponseDto", () => {
  it("mock 픽스처를 통과시킨다 (계약 일치)", () => {
    expect(memberProfileResponseDto.parse(memberMeUser)).toEqual(memberMeUser);
    expect(memberProfileResponseDto.parse(memberMeArtisan)).toEqual(
      memberMeArtisan,
    );
  });

  it("role이 알 수 없는 값이면 거부한다", () => {
    expect(
      memberProfileResponseDto.safeParse({
        ...memberMeUser,
        role: "SUPERUSER",
      }).success,
    ).toBe(false);
  });

  it("memberId 소수는 거부한다 (Long 계약)", () => {
    expect(
      memberProfileResponseDto.safeParse({ ...memberMeUser, memberId: 1.5 })
        .success,
    ).toBe(false);
  });

  it("nickname·profileImageUrl은 null을 허용한다", () => {
    expect(
      memberProfileResponseDto.safeParse({
        ...memberMeUser,
        nickname: null,
        profileImageUrl: null,
      }).success,
    ).toBe(true);
  });
});

describe("loginResponseDto", () => {
  it("accessToken + member를 통과시킨다", () => {
    expect(
      loginResponseDto.parse({
        accessToken: SEED_ACCESS_TOKEN,
        member: memberMeUser,
      }),
    ).toEqual({ accessToken: SEED_ACCESS_TOKEN, member: memberMeUser });
  });

  it("member 누락은 거부한다", () => {
    expect(
      loginResponseDto.safeParse({ accessToken: SEED_ACCESS_TOKEN }).success,
    ).toBe(false);
  });
});

describe("emailVerificationResponseDto", () => {
  it("expiresInSeconds 양의 정수를 통과시킨다", () => {
    expect(
      emailVerificationResponseDto.parse({ expiresInSeconds: 600 }),
    ).toEqual({ expiresInSeconds: 600 });
  });

  it("음수·소수는 거부한다", () => {
    expect(
      emailVerificationResponseDto.safeParse({ expiresInSeconds: -1 }).success,
    ).toBe(false);
    expect(
      emailVerificationResponseDto.safeParse({ expiresInSeconds: 1.5 }).success,
    ).toBe(false);
  });
});

describe("signupResponseDto", () => {
  // §0.2(design.md) — 로그인과 동일 모양이라고 가정한 별칭. loginResponseDto 계약을 그대로 따른다.
  it("accessToken + member를 통과시킨다(loginResponseDto와 동일 계약)", () => {
    expect(
      signupResponseDto.parse({
        accessToken: SEED_ACCESS_TOKEN,
        member: memberMeUser,
      }),
    ).toEqual({ accessToken: SEED_ACCESS_TOKEN, member: memberMeUser });
  });
});
