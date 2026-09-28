import { http } from "msw";
import { expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { fetchHomeArtisans } from "./api";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it("홈 장인관은 실제 장인 API의 값과 미제공 정보를 구분한다", async () => {
  server.use(
    http.get("*/api/member/artisans", () =>
      mockOk({
        content: [
          {
            artisanId: 1,
            businessName: "공방",
            introduction: null,
            certificationLevel: null,
            careerYears: null,
            productCount: 0,
            region: null,
          },
        ],
      }),
    ),
  );
  expect(await fetchHomeArtisans()).toMatchObject([
    { id: "1", headline: "공방", experience: "미제공", artworkCount: "총 0점" },
  ]);
});
