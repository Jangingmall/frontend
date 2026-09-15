import { describe, expect, it } from "vitest";

import { safeReturnUrl } from "./return-url";

describe("safeReturnUrl", () => {
  it("null이면 fallback", () => {
    expect(safeReturnUrl(null)).toBe("/mypage");
  });

  it("빈 문자열이면 fallback", () => {
    expect(safeReturnUrl("")).toBe("/mypage");
  });

  it("정상 내부 상대경로는 그대로 통과시킨다", () => {
    expect(safeReturnUrl("/products")).toBe("/products");
    expect(safeReturnUrl("/mypage/orders/1")).toBe("/mypage/orders/1");
  });

  it("URL 인코딩된 값을 디코딩해서 통과시킨다", () => {
    expect(safeReturnUrl("%2Fproducts")).toBe("/products");
  });

  it("디코딩할 수 없는 값이면 fallback", () => {
    expect(safeReturnUrl("%")).toBe("/mypage");
  });

  it("/로 시작하지 않으면 fallback (절대 URL 등)", () => {
    expect(safeReturnUrl("https://evil.com")).toBe("/mypage");
    expect(safeReturnUrl("products")).toBe("/mypage");
  });

  it("protocol-relative(//)는 fallback", () => {
    expect(safeReturnUrl("//evil.com")).toBe("/mypage");
  });

  it("역슬래시로 시작하는 protocol-relative 우회는 fallback", () => {
    expect(safeReturnUrl("/\\evil.com")).toBe("/mypage");
  });

  it("역슬래시가 포함되면 fallback", () => {
    expect(safeReturnUrl("/products\\..\\evil")).toBe("/mypage");
  });

  it('"/scheme:..." 형태의 우회는 fallback', () => {
    expect(safeReturnUrl("/https://evil.com")).toBe("/mypage");
    expect(safeReturnUrl("/javascript:alert(1)")).toBe("/mypage");
  });

  it("커스텀 fallback을 지정할 수 있다", () => {
    expect(safeReturnUrl(null, "/")).toBe("/");
    expect(safeReturnUrl("//evil.com", "/")).toBe("/");
  });
});
