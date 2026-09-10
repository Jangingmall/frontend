import { describe, expect, it } from "vitest";

import { memberMeArtisan, memberMeUser } from "./mock/fixtures";
import { accessTokenResponseDto, memberMeResponseDto } from "./validation";

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

describe("memberMeResponseDto", () => {
  it("mock 픽스처를 통과시킨다 (계약 일치)", () => {
    expect(memberMeResponseDto.parse(memberMeUser)).toEqual(memberMeUser);
    expect(memberMeResponseDto.parse(memberMeArtisan)).toEqual(memberMeArtisan);
  });

  it("roles가 비었거나 알 수 없는 값이면 거부한다", () => {
    expect(
      memberMeResponseDto.safeParse({ id: 1, name: "x", roles: [] }).success,
    ).toBe(false);
    expect(
      memberMeResponseDto.safeParse({ id: 1, name: "x", roles: ["SUPERUSER"] })
        .success,
    ).toBe(false);
  });

  it("id 소수는 거부한다 (Long 계약)", () => {
    expect(
      memberMeResponseDto.safeParse({ id: 1.5, name: "x", roles: ["USER"] })
        .success,
    ).toBe(false);
  });
});
