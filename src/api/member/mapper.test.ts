import { describe, expect, it } from "vitest";

import { mapAddress, mapMemberDetail, mapMemberProfile } from "./mapper";
import { memberProfileResponseDto } from "./validation";

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
        phone: "01011112222",
        authProvider: "LOCAL",
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
        phone: "01022223333",
        authProvider: "LOCAL",
      }),
    ).toEqual({
      id: 2,
      name: "이공방",
      role: "ARTISAN",
    });
  });
});

describe("mapMemberDetail", () => {
  it("백엔드 provider를 매핑하고 누락된 전화번호는 빈 입력으로 남긴다", () => {
    const dto = memberProfileResponseDto.parse({
      memberId: 7,
      email: "buyer@example.test",
      name: "구매자",
      nickname: null,
      role: "USER",
      profileImageUrl: null,
      provider: "kakao",
    });
    expect(mapMemberDetail(dto)).toMatchObject({
      phone: "",
      authProvider: "kakao",
    });
  });
  it("email·phone·authProvider까지 포함한 마이페이지 전용 모델로 변환한다", () => {
    expect(
      mapMemberDetail({
        memberId: 1,
        email: "user@midam.test",
        name: "김미담",
        nickname: "미담이",
        role: "USER",
        profileImageUrl: null,
        phone: "01011112222",
        authProvider: "LOCAL",
      }),
    ).toEqual({
      id: 1,
      name: "김미담",
      email: "user@midam.test",
      phone: "01011112222",
      authProvider: "local",
      role: "USER",
    });
  });

  it("authProvider가 null이면 local로 취급한다", () => {
    expect(
      mapMemberDetail({
        memberId: 1,
        email: "user@midam.test",
        name: "김미담",
        nickname: null,
        role: "USER",
        profileImageUrl: null,
        phone: "01011112222",
        authProvider: null,
      }).authProvider,
    ).toBe("local");
  });

  it("NAVER/KAKAO는 소문자로 정규화한다", () => {
    expect(
      mapMemberDetail({
        memberId: 1,
        email: "user@midam.test",
        name: "김미담",
        nickname: null,
        role: "USER",
        profileImageUrl: null,
        phone: "01011112222",
        authProvider: "NAVER",
      }).authProvider,
    ).toBe("naver");
    expect(
      mapMemberDetail({
        memberId: 1,
        email: "user@midam.test",
        name: "김미담",
        nickname: null,
        role: "USER",
        profileImageUrl: null,
        phone: "01011112222",
        authProvider: "KAKAO",
      }).authProvider,
    ).toBe("kakao");
  });
});

describe("mapAddress", () => {
  it("addressId를 id로 좁히고 나머지 필드는 그대로 옮긴다", () => {
    expect(
      mapAddress({
        addressId: 101,
        recipientName: "김미담",
        phone: "01011112222",
        zipCode: "06035",
        address1: "서울특별시 강남구 학동로 343",
        address2: "더 피나클 강남 15층",
        isDefault: true,
      }),
    ).toEqual({
      id: 101,
      recipientName: "김미담",
      phone: "01011112222",
      zipCode: "06035",
      address1: "서울특별시 강남구 학동로 343",
      address2: "더 피나클 강남 15층",
      isDefault: true,
    });
  });
});
