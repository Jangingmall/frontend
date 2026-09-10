import { describe, expect, it } from "vitest";

import { mockError, mockOk, mockPaged } from "./envelope";

describe("mockOk", () => {
  it("wraps data in the success envelope and mirrors the HTTP status", async () => {
    const response = mockOk({ id: 1 }, 201);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      status: 201,
      data: { id: 1 },
    });
  });

  it("defaults to 200 and allows a null body", async () => {
    const response = mockOk(null);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      status: 200,
      data: null,
    });
  });
});

describe("mockPaged", () => {
  it("nests items and totalCount inside the success envelope", async () => {
    const response = mockPaged([{ id: 1 }, { id: 2 }], 5);

    await expect(response.json()).resolves.toEqual({
      success: true,
      status: 200,
      data: { items: [{ id: 1 }, { id: 2 }], totalCount: 5 },
    });
  });

  it("defaults totalCount to the item count", async () => {
    const response = mockPaged([{ id: 1 }, { id: 2 }]);
    const body = (await response.json()) as { data: { totalCount: number } };

    expect(body.data.totalCount).toBe(2);
  });
});

describe("mockError", () => {
  it("builds the failure envelope with errorCode and mirrors the status", async () => {
    const response = mockError(500, "INTERNAL_ERROR");

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      status: 500,
      errorCode: "INTERNAL_ERROR",
    });
  });

  it("includes message only when provided", async () => {
    await expect(
      mockError(409, "CONFLICT", "이미 존재합니다").json(),
    ).resolves.toEqual({
      success: false,
      status: 409,
      errorCode: "CONFLICT",
      message: "이미 존재합니다",
    });
    await expect(mockError(409, "CONFLICT").json()).resolves.not.toHaveProperty(
      "message",
    );
  });

  it("passes through unknown error codes verbatim", async () => {
    const body = (await mockError(400, "SOME_NEW_CODE").json()) as {
      errorCode: string;
    };

    expect(body.errorCode).toBe("SOME_NEW_CODE");
  });
});
