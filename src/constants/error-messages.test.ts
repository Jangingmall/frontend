import { describe, expect, it } from "vitest";

import { KNOWN_ERROR_CODES } from "@/types/api";

import { GENERIC_ERROR_MESSAGE, resolveErrorMessage } from "./error-messages";

describe("resolveErrorMessage", () => {
  it("알려진 errorCode면 전용 문구를 돌려준다", () => {
    expect(resolveErrorMessage("UNAUTHORIZED")).toBe("로그인이 필요해요.");
    expect(resolveErrorMessage("NOT_FOUND")).toBe(
      "요청한 정보를 찾을 수 없어요.",
    );
  });

  it("모든 알려진 errorCode에 빈 문구 없이 값이 채워져 있다", () => {
    // REQUEST_INVALID처럼 사용자가 거의 안 보는 계약 오류는 GENERIC과 같은 문장이어도 된다
    // (design.md — 억지로 다르게 쓰지 않는다). 여기서 보장하는 건 "빈 값이 없다"는 커버리지뿐.
    for (const code of KNOWN_ERROR_CODES) {
      expect(resolveErrorMessage(code)).toBeTruthy();
    }
  });

  it("code가 없거나 알 수 없으면 status 문구로 떨어진다", () => {
    expect(resolveErrorMessage(undefined, 404)).toBe(
      "요청한 정보를 찾을 수 없어요.",
    );
    expect(resolveErrorMessage("UNKNOWN_CODE", 403)).toBe(
      "접근 권한이 없어요.",
    );
  });

  it("code·status 둘 다 없거나 안 걸리면 GENERIC으로 떨어진다", () => {
    expect(resolveErrorMessage()).toBe(GENERIC_ERROR_MESSAGE);
    expect(resolveErrorMessage(null, null)).toBe(GENERIC_ERROR_MESSAGE);
    expect(resolveErrorMessage("UNKNOWN_CODE", 599)).toBe(
      GENERIC_ERROR_MESSAGE,
    );
  });

  it("우선순위는 errorCode가 status보다 앞선다", () => {
    // UNAUTHORIZED(401)와 다른 status를 같이 줘도 code 문구가 이긴다
    expect(resolveErrorMessage("UNAUTHORIZED", 500)).toBe("로그인이 필요해요.");
  });

  it("Object.prototype 속성 이름이 code로 와도 프로토타입 체인을 안 탄다", () => {
    // `code in ERROR_MESSAGE_BY_CODE`였다면 "toString" 등이 상속 프로퍼티에 걸려
    // 함수·객체를 돌려줬다(unknown-safe 계약 위반). isKnownErrorCode는 own-value만
    // 비교하는 배열 includes라 이 클래스의 문제에서 안전하다.
    for (const code of [
      "toString",
      "constructor",
      "hasOwnProperty",
      "__proto__",
    ]) {
      const result = resolveErrorMessage(code, 404);
      expect(typeof result).toBe("string");
      expect(result).toBe("요청한 정보를 찾을 수 없어요.");
    }
  });
});
