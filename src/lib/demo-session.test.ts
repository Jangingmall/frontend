import { expect, it } from "vitest";

import { privateRequestPath } from "./demo-session";
it("시연 로그인 세션의 인증 요청만 목업 namespace에 격리한다", () => {
  expect(privateRequestPath("/api/payments/confirm", true, true)).toBe(
    "/api/mock/session/payments/confirm",
  );
  expect(privateRequestPath("/api/products", false, true)).toBe(
    "/api/products",
  );
  expect(privateRequestPath("/api/member/me", true, false)).toBe(
    "/api/member/me",
  );
  expect(privateRequestPath("/api/mock/products/1/inquiries", true, true)).toBe(
    "/api/mock/products/1/inquiries",
  );
});
