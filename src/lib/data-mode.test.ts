import { describe, expect, it } from "vitest";

import {
  isMockProductQuery,
  resolveDataMode,
  shouldMockRequest,
} from "./data-mode";

describe("두 데이터 모드의 요청 경계", () => {
  it("명시 모드와 이전 설정을 판정하고 충돌을 거부한다", () => {
    expect(resolveDataMode("msw", undefined)).toBe("msw");
    expect(resolveDataMode("api", undefined)).toBe("api");
    expect(resolveDataMode(undefined, "enabled")).toBe("msw");
    expect(() => resolveDataMode("api", "enabled")).toThrow();
  });
  it("API 모드에서는 시연 네임스페이스를 포함해 목업을 허용하지 않는다", () => {
    expect(shouldMockRequest("api", "/api/products")).toBe(false);
    expect(shouldMockRequest("api", "/api/member/token/refresh")).toBe(false);
    expect(shouldMockRequest("api", "/api/payments/confirm")).toBe(false);
    expect(shouldMockRequest("api", "/api/mock/products/1/inquiries")).toBe(
      false,
    );
    expect(shouldMockRequest("msw", "/api/payments/confirm")).toBe(true);
    expect(shouldMockRequest("msw", "/other")).toBe(false);
  });
  it("실제 검색과 미지원 필터 조합을 명시적으로 구분한다", () => {
    expect(isMockProductQuery("api", { sort: "newest" })).toBe(false);
    expect(isMockProductQuery("api", { materials: ["wood"] })).toBe(true);
    expect(isMockProductQuery("api", { sort: "popular" })).toBe(false);
    expect(isMockProductQuery("api", { hasGiftWrap: true })).toBe(true);
    expect(isMockProductQuery("msw", {})).toBe(true);
  });
});
