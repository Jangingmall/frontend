import { describe, expect, it } from "vitest";

import { ApiError } from "./api-error";
import { parseBody, resolveResponse, unwrapSuccess } from "./response";

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("parseBody", () => {
  it("JSON이 아니면 undefined", async () => {
    const response = new Response("hi", {
      headers: { "content-type": "text/plain" },
    });
    expect(await parseBody(response)).toBeUndefined();
  });

  it("빈 본문이면 undefined", async () => {
    const response = new Response("", {
      headers: { "content-type": "application/json" },
    });
    expect(await parseBody(response)).toBeUndefined();
  });

  it("JSON 본문을 파싱한다", async () => {
    expect(await parseBody(jsonResponse({ a: 1 }))).toEqual({ a: 1 });
  });
});

describe("unwrapSuccess", () => {
  it("봉투에서 data를 꺼낸다", () => {
    expect(
      unwrapSuccess({ success: true, status: 200, data: { id: 1 } }),
    ).toEqual({ id: 1 });
  });

  it("봉투 형태가 아니면 ApiError(502)", () => {
    expect(() => unwrapSuccess({ nope: true })).toThrow(ApiError);
    expect(() => unwrapSuccess(null)).toThrow(ApiError);
    try {
      unwrapSuccess({ success: false });
    } catch (error) {
      expect((error as ApiError).status).toBe(502);
    }
  });
});

describe("resolveResponse", () => {
  it("2xx 봉투를 해제한다", async () => {
    await expect(
      resolveResponse(
        jsonResponse({ success: true, status: 200, data: [1, 2] }),
      ),
    ).resolves.toEqual([1, 2]);
  });

  it("!ok면 status·errorCode로 ApiError", async () => {
    await expect(
      resolveResponse(
        jsonResponse(
          { success: false, status: 404, errorCode: "NOT_FOUND" },
          { status: 404 },
        ),
      ),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("5xx도 ApiError", async () => {
    await expect(
      resolveResponse(
        jsonResponse(
          { success: false, status: 500, errorCode: "INTERNAL_ERROR" },
          { status: 500 },
        ),
      ),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("2xx인데 봉투가 파손이면 ApiError(502)", async () => {
    await expect(
      resolveResponse(jsonResponse({ weird: 1 })),
    ).rejects.toMatchObject({ status: 502 });
  });
});
