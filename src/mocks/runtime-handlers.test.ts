import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createRuntimeHandlers } from "./runtime-handlers";

describe("선택적 MSW", () => {
  it("API 모드의 실요청은 통과시키고 목업 카탈로그만 응답한다", async () => {
    const handlers = createRuntimeHandlers("api");
    expect(
      (
        await getResponse(
          handlers,
          new Request("http://localhost/api/products"),
        )
      )?.headers.get("x-msw-intention"),
    ).toBe("passthrough");
    const result = await getResponse(
      handlers,
      new Request("http://localhost/api/mock/catalogue/products?page=1&size=2"),
    );
    expect(result?.status).toBe(200);
    expect((await result?.json()).data.items).toHaveLength(2);
  });
  it("알 수 없는 목업 요청을 실서버로 보내지 않는다", async () => {
    const result = await getResponse(
      createRuntimeHandlers("api"),
      new Request("http://localhost/api/mock/unknown"),
    );
    expect(result?.status).toBe(501);
  });
});

it.each([
  "/api/mock/member/oauth2/naver",
  "/api/mock/session/member/me",
  "/api/mock/catalogue/member/me",
])("API 모드에서는 인증 시연 요청 %s을 허용하지 않는다", async (path) => {
  const response = await getResponse(
    createRuntimeHandlers("api"),
    new Request("http://localhost" + path),
  );
  expect(response?.status).toBe(501);
});

it("API 모드에서 시연 취소와 카탈로그 쓰기를 허용하지 않는다", async () => {
  for (const path of [
    "/api/mock/orders/1/cancel-request",
    "/api/mock/catalogue/products",
  ]) {
    const response = await getResponse(
      createRuntimeHandlers("api"),
      new Request("http://localhost" + path, { method: "POST" }),
    );
    expect(response?.status).toBe(501);
  }
});
