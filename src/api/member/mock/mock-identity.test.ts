import { beforeEach, describe, expect, it } from "vitest";

import {
  clearDynamicMember,
  getDynamicMember,
  setDynamicMember,
  setMockIdentity,
} from "./mock-identity";

const VALID_MEMBER = {
  memberId: 100,
  email: "newbie@midam.test",
  name: "홍길동",
  nickname: null,
  role: "USER" as const,
  profileImageUrl: null,
};

beforeEach(() => {
  localStorage.clear();
});

describe("mock-identity dynamic member", () => {
  it("setDynamicMember로 저장한 값을 getDynamicMember가 그대로 돌려준다", () => {
    setDynamicMember(VALID_MEMBER);

    expect(getDynamicMember()).toEqual(VALID_MEMBER);
  });

  it("아무것도 저장 안 했으면 null", () => {
    expect(getDynamicMember()).toBeNull();
  });

  it("손상된 JSON이면 null(throw 안 함)", () => {
    localStorage.setItem("midam:mockDynamicMember", "{이건 JSON이 아님");

    expect(getDynamicMember()).toBeNull();
  });

  it("스키마와 안 맞는 값(memberId 누락)이면 null", () => {
    // 코드 리뷰 — 예전엔 타입 단언만 하고 검증을 안 해서, 손상되거나 예전 스키마로 남은
    // localStorage 값도 그대로 통과했다. `memberProfileResponseDto.safeParse()`로 고쳤다.
    localStorage.setItem(
      "midam:mockDynamicMember",
      JSON.stringify({ email: "x@midam.test", name: "이상함" }),
    );

    expect(getDynamicMember()).toBeNull();
  });

  it("setMockIdentity를 다시 부르면 저장된 값이 지워진다", () => {
    setDynamicMember(VALID_MEMBER);

    setMockIdentity("USER");

    expect(getDynamicMember()).toBeNull();
  });

  it("clearDynamicMember로 명시적으로 지울 수 있다", () => {
    setDynamicMember(VALID_MEMBER);

    clearDynamicMember();

    expect(getDynamicMember()).toBeNull();
  });
});
