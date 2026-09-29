import { getResponse } from "msw";
import { expect, it } from "vitest";

import { createRuntimeHandlers } from "./runtime-handlers";
it("MSW 모드의 재입고 시연 상태는 사용자별로 격리한다", async () => {
  const handlers = createRuntimeHandlers("msw");
  const request = (method: string, viewer: string) =>
    new Request("http://localhost/api/mock/products/9999/restock", {
      method,
      headers: { "X-Demo-Viewer": viewer },
    });
  expect((await getResponse(handlers, request("POST", "user-1")))?.status).toBe(
    200,
  );
  expect(
    (await (await getResponse(handlers, request("GET", "user-1")))?.json()).data
      .restockRequested,
  ).toBe(true);
  expect(
    (await (await getResponse(handlers, request("GET", "user-2")))?.json()).data
      .restockRequested,
  ).toBe(false);
});

it("real and demo members with the same ID cannot share private inquiries", async () => {
  const handlers = createRuntimeHandlers("msw");
  const url = "http://localhost/api/mock/products/102/inquiries";
  const headers = {
    "X-Demo-Viewer": "user-1",
    "Content-Type": "application/json",
  };
  await getResponse(
    handlers,
    new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "기타",
        title: "private-unique",
        body: "private-body",
        isSecret: true,
      }),
    }),
  );
  const own = await (
    await getResponse(handlers, new Request(url, { headers }))
  )?.json();
  const demo = await (
    await getResponse(
      handlers,
      new Request(url, { headers: { "X-Demo-Viewer": "demo-1" } }),
    )
  )?.json();
  expect(JSON.stringify(own)).toContain("private-unique");
  expect(JSON.stringify(demo)).not.toContain("private-unique");
});
