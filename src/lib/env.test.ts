import { describe, expect, it } from "vitest";
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
});
