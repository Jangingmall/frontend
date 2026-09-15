import { describe, expect, it } from "vitest";

import { mapMemberProfile } from "./mapper";

describe("mapMemberProfile", () => {
  it("DTO를 AuthUser 형태로 좁힌다 (memberId → id, role 단일값)", () => {
    expect(
      mapMemberProfile({
        memberId: 1,
        email: "user@midam.test",
        name: "김미담",
        nickname: "미담이",
        role: "USER",
        profileImageUrl: null,
      }),
    ).toEqual({
      id: 1,
      name: "김미담",
      role: "USER",
    });
  });

  it("판매자(ARTISAN) role도 그대로 좁힌다", () => {
    expect(
      mapMemberProfile({
        memberId: 2,
        email: "artisan@midam.test",
        name: "이공방",
        nickname: "이공방",
        role: "ARTISAN",
        profileImageUrl: null,
      }),
    ).toEqual({
      id: 2,
      name: "이공방",
      role: "ARTISAN",
    });
  });
});
