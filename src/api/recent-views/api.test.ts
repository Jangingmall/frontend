import { beforeEach, describe, expect, it } from "vitest";

import { server } from "@/mocks/server";

import { clearRecentViews, fetchRecentViews } from "./api";
import { RECENT_VIEW_FIXTURES } from "./mock/fixtures";
import { recentViewHandlers } from "./mock/handlers";

const SEED_RECENT_VIEW_FIXTURES = structuredClone(RECENT_VIEW_FIXTURES);

describe("최근 본 상품", () => {
  beforeEach(() => {
    server.use(...recentViewHandlers);
    RECENT_VIEW_FIXTURES.length = 0;
    RECENT_VIEW_FIXTURES.push(...structuredClone(SEED_RECENT_VIEW_FIXTURES));
  });

  it("최신순(viewedAt DESC)으로 이미 정렬된 페이지를 조회한다", async () => {
    const page = await fetchRecentViews(1);
    expect(page.totalCount).toBe(SEED_RECENT_VIEW_FIXTURES.length);
    expect(page.items[0]?.id).toBe(SEED_RECENT_VIEW_FIXTURES[0]?.productId);
  });

  it("전체 삭제 후엔 빈 목록을 반환한다", async () => {
    await clearRecentViews();
    const page = await fetchRecentViews(1);
    expect(page.items).toHaveLength(0);
    expect(page.totalCount).toBe(0);
  });
});
