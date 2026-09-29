import { getResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createRuntimeHandlers } from "./runtime-handlers";

describe("MSW 실행 모드", () => {
  it("API 모드에서 실제 요청과 시연 요청에 모두 목업 응답을 만들지 않는다", async () => {
    for (const path of [
      "/api/products",
      "/api/mock/catalogue/products",
      "/api/mock/unknown",
    ]) {
      expect(
        await getResponse(
          createRuntimeHandlers("api"),
          new Request("http://localhost" + path),
        ),
      ).toBeUndefined();
    }
  });
  it("MSW 모드의 미등록 시연 요청은 실서버로 보내지 않는다", async () => {
    const response = await getResponse(
      createRuntimeHandlers("msw"),
      new Request("http://localhost/api/mock/unknown"),
    );
    expect(response?.status).toBe(501);
  });
});
