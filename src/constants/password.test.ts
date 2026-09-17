import { describe, expect, it } from "vitest";

import { countPasswordClasses, passwordStrengthState } from "./password";

describe("countPasswordClasses", () => {
  it("대문자·소문자·숫자·특수기호 중 포함된 종류 수를 센다", () => {
    expect(countPasswordClasses("abc")).toBe(1);
    expect(countPasswordClasses("Abc1")).toBe(3);
    expect(countPasswordClasses("Abc1!")).toBe(4);
  });
});

describe("passwordStrengthState", () => {
  it("빈 값이면 default", () => {
    expect(passwordStrengthState("")).toEqual({ state: "default", label: "" });
  });

  it("8자 미만이거나 1종류 이하면 alert", () => {
    expect(passwordStrengthState("abc").state).toBe("alert");
    expect(passwordStrengthState("abcdefgh").state).toBe("alert");
  });

  it("2종류 포함 8자 이상이면 caution", () => {
    expect(passwordStrengthState("abcdefg1").state).toBe("caution");
  });

  it("3종류 포함 8자 이상이면 good", () => {
    expect(passwordStrengthState("Abcdefg1").state).toBe("good");
  });

  it("4종류 포함 8자 이상이면 perfect", () => {
    expect(passwordStrengthState("Abcdefg1!").state).toBe("perfect");
  });
});
