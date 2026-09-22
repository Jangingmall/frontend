import { http } from "msw";
import { expect, it } from "vitest";

import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { exchangeOAuthTicket } from "./oauth";

it("exchanges an existing member ticket and authenticates the profile request", async () => {
  let authorization: string | null = null;
  server.use(
    http.post("*/api/member/oauth2/exchange", () =>
      mockOk({ onboardingRequired: false, accessToken: "oauth-session" }),
    ),
    http.get("*/api/member/me", ({ request }) => {
      authorization = request.headers.get("authorization");
      return mockOk({
        memberId: 9,
        email: "social@example.test",
        name: "회원",
        nickname: null,
        role: "USER",
        profileImageUrl: null,
        provider: "naver",
      });
    }),
  );
  expect(await exchangeOAuthTicket()).toMatchObject({
    outcome: "authenticated",
    user: { id: 9 },
  });
  expect(authorization).toBe("Bearer oauth-session");
});

it("requests onboarding without fetching a protected profile", async () => {
  let profiles = 0;
  server.use(
    http.post("*/api/member/oauth2/exchange", () =>
      mockOk({ onboardingRequired: true, accessToken: null }),
    ),
    http.get("*/api/member/me", () => {
      profiles++;
      return mockError(401, "UNAUTHORIZED");
    }),
  );
  expect(await exchangeOAuthTicket()).toEqual({ outcome: "needsProfile" });
  expect(profiles).toBe(0);
});

it("does not refresh or retry a consumed or expired OAuth ticket", async () => {
  let exchanges = 0;
  let refreshes = 0;
  server.use(
    http.post("*/api/member/oauth2/exchange", () => {
      exchanges++;
      return mockError(401, "UNAUTHORIZED");
    }),
    http.post("*/api/member/token/refresh", () => {
      refreshes++;
      return mockError(401, "UNAUTHORIZED");
    }),
  );
  await expect(exchangeOAuthTicket()).rejects.toMatchObject({ status: 401 });
  expect(exchanges).toBe(1);
  expect(refreshes).toBe(0);
});
