import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { RevalidationRequestError, verifyAndRevalidate } from "./revalidation";

const secret = "revalidate-test-secret";
const timestamp = "1788292800";
const body = JSON.stringify({
  event: "product.contentPublished",
  eventId: "01JTEST",
  occurredAt: "2026-09-02T12:00:00Z",
  data: { productId: 123 },
});

function signature(rawBody = body, signedTimestamp = timestamp) {
  return `sha256=${createHmac("sha256", secret)
    .update(`${signedTimestamp}.${rawBody}`)
    .digest("hex")}`;
}

function expectErrorStatus(action: () => unknown, status: 400 | 401) {
  try {
    action();
    throw new Error("Expected a revalidation request error.");
  } catch (error) {
    expect(error).toBeInstanceOf(RevalidationRequestError);
    expect(error).toMatchObject({ status });
  }
}

describe("verifyAndRevalidate", () => {
  it("revalidates the product detail and collection tags for published content", () => {
    const revalidateTag = vi.fn();

    const result = verifyAndRevalidate({
      rawBody: body,
      timestamp,
      signature: signature(),
      secret,
      now: 1_788_292_900_000,
      revalidateTag,
    });

    expect(result).toEqual({
      eventId: "01JTEST",
      tags: ["product:123", "products"],
    });
    expect(revalidateTag).toHaveBeenCalledWith("product:123", "max");
    expect(revalidateTag).toHaveBeenCalledWith("products", "max");
  });

  it("rejects an invalid HMAC signature before parsing the event", () => {
    expectErrorStatus(
      () =>
        verifyAndRevalidate({
          rawBody: body,
          timestamp,
          signature: "sha256=invalid",
          secret,
          now: 1_788_292_900_000,
          revalidateTag: vi.fn(),
        }),
      401,
    );
  });

  it("rejects an event older than five minutes", () => {
    expectErrorStatus(
      () =>
        verifyAndRevalidate({
          rawBody: body,
          timestamp,
          signature: signature(),
          secret,
          now: 1_788_593_000_000,
          revalidateTag: vi.fn(),
        }),
      401,
    );
  });

  it("rejects unknown events as contract errors", () => {
    const invalidBody = JSON.stringify({
      ...JSON.parse(body),
      event: "product.unknown",
    });

    expectErrorStatus(
      () =>
        verifyAndRevalidate({
          rawBody: invalidBody,
          timestamp,
          signature: signature(invalidBody),
          secret,
          now: 1_788_292_900_000,
          revalidateTag: vi.fn(),
        }),
      400,
    );
  });

  it("rejects malformed JSON as a contract error", () => {
    const malformedBody = "{not-json";

    expectErrorStatus(
      () =>
        verifyAndRevalidate({
          rawBody: malformedBody,
          timestamp,
          signature: signature(malformedBody),
          secret,
          now: 1_788_292_900_000,
          revalidateTag: vi.fn(),
        }),
      400,
    );
  });
});
