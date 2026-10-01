import { http } from "msw";
import { expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import { GIFT_THEMES } from "@/types/gift-theme";

import { fetchHomeDemoArtisans, fetchHomeDemoGifts } from "./demo-server";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));

it("API 모드의 홈은 네트워크 없이 장인과 모든 선물 테마를 MSW로 렌더링한다", async () => {
  const network = vi.fn(() => {
    throw new Error("홈 시연은 네트워크를 사용하지 않는다");
  });
  server.use(http.all("*", network));
  const artisans = await fetchHomeDemoArtisans();
  expect(artisans.length).toBeGreaterThan(0);
  expect(artisans[0].headline).toBeTruthy();
  for (const theme of GIFT_THEMES) {
    const gifts = await fetchHomeDemoGifts(theme.id);
    expect(gifts.items).toHaveLength(3);
    expect(gifts.items.every((item) => item.isDemo)).toBe(true);
  }
  expect(network).not.toHaveBeenCalled();
});
