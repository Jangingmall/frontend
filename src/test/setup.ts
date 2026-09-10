import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "@/mocks/server";

// 모든 테스트에서 MSW node 서버를 켠다. 등록되지 않은 요청은 실패로 —
// 단위 테스트가 때리는 엔드포인트는 명확하므로 stub 누락을 즉시 드러낸다.
// (docs/testing.md §4)
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
