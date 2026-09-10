import { afterEach, describe, expect, it, vi } from "vitest";

import { validateEnvironment } from "./env";

describe("validateEnvironment", () => {
  it("requires the server-only ISR variables in production", () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "production",
        API_BASE_URL: "https://api.example.com",
      }),
    ).toThrow(
      "Production requires API_BASE_URL and REVALIDATE_WEBHOOK_SECRET.",
    );
  });

  it("does not expose the webhook secret in the returned public environment", () => {
    const environment = validateEnvironment({
      NODE_ENV: "production",
      API_BASE_URL: "https://api.example.com",
      REVALIDATE_WEBHOOK_SECRET: "secret",
      NEXT_PUBLIC_TOSS_CLIENT_KEY: "test_ck",
    });

    expect(environment.server.revalidateWebhookSecret).toBe("secret");
    expect(environment.public).toEqual({ tossClientKey: "test_ck" });
  });

  it('accepts the mock switch only as "enabled" or empty', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "test",
        NEXT_PUBLIC_API_MOCKING: "enabled",
      }),
    ).not.toThrow();
    expect(() =>
      validateEnvironment({ NODE_ENV: "test", NEXT_PUBLIC_API_MOCKING: "" }),
    ).not.toThrow();
    expect(() =>
      validateEnvironment({ NODE_ENV: "test", NEXT_PUBLIC_API_MOCKING: "on" }),
    ).toThrow();
  });
});

// publicEnv/serverEnv는 모듈 로드 시 process.env에서 값을 굳힌다. 케이스별로
// stubEnv + resetModules 후 재 import 한다.
describe("runtime env objects", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('publicEnv.apiMocking is false unless NEXT_PUBLIC_API_MOCKING is exactly "enabled"', async () => {
    vi.resetModules();
    const unset = await import("./env");
    expect(unset.publicEnv.apiMocking).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "enabled");
    vi.resetModules();
    const enabled = await import("./env");
    expect(enabled.publicEnv.apiMocking).toBe(true);
  });

  it("serverEnv reads server-only values, falling back to empty string", async () => {
    vi.stubEnv("API_BASE_URL", "https://real.example.com");
    vi.stubEnv("REVALIDATE_WEBHOOK_SECRET", "");
    vi.resetModules();
    const { serverEnv } = await import("./env.server");
    expect(serverEnv.apiBaseUrl).toBe("https://real.example.com");
    expect(serverEnv.revalidateWebhookSecret).toBe("");
  });
});
