import { describe, expect, it } from "vitest";

import { formatPhone, PHONE_PREFIXES, splitPhone } from "./phone";

describe("PHONE_PREFIXES", () => {
  it("010을 포함한 6개의 통신사 접두사를 담는다", () => {
    expect(PHONE_PREFIXES).toEqual(["010", "011", "016", "017", "018", "019"]);
  });
});

describe("splitPhone", () => {
  it("하이픈 없는 휴대전화를 접두사·중간·끝 4자리로 나눈다", () => {
    expect(splitPhone("01011112222")).toEqual({
      phonePrefix: "010",
      phoneMiddle: "1111",
      phoneLast: "2222",
    });
  });

  it("알 수 없는 접두사면 010으로 대체한다", () => {
    expect(splitPhone("02011112222")).toEqual({
      phonePrefix: "010",
      phoneMiddle: "1111",
      phoneLast: "2222",
    });
  });
});

describe("formatPhone", () => {
  it("010-1111-2222 형식으로 바꾼다", () => {
    expect(formatPhone("01011112222")).toBe("010-1111-2222");
  });
});
