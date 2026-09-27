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
