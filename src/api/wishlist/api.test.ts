import { beforeEach, describe, expect, it } from "vitest";

import { server } from "@/mocks/server";

import {
  addWish,
  checkWished,
  fetchWishedIds,
  fetchWishlist,
  removeWish,
} from "./api";
import { WISH_FIXTURES } from "./mock/fixtures";
import { wishlistHandlers } from "./mock/handlers";

const SEED_WISH_FIXTURES = structuredClone(WISH_FIXTURES);

describe("찜 목록", () => {
  beforeEach(() => {
    server.use(...wishlistHandlers);
    // add/removeWish 테스트가 모듈 스코프 WISH_FIXTURES를 mutate하므로 매 테스트 전 복원.
    WISH_FIXTURES.length = 0;
    WISH_FIXTURES.push(...structuredClone(SEED_WISH_FIXTURES));
  });

  it("페이지 단위로 조회한다", async () => {
    const page = await fetchWishlist(1);
    expect(page.page).toBe(1);
    expect(page.totalCount).toBe(WISH_FIXTURES.length);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it("찜 등록/취소가 다음 조회에 즉시 반영된다", async () => {
    const before = await fetchWishlist(1);
    expect(before.items.some((item) => item.id === 999)).toBe(false);

    await addWish(999); // 카탈로그에 없는 id — 목록 반영은 안 되지만 성공 응답은 온다
    await expect(checkWished(101)).resolves.toBe(true);

    await removeWish(101);
    const after = await fetchWishlist(1);
    expect(after.items.some((item) => item.id === 101)).toBe(false);
    await expect(checkWished(101)).resolves.toBe(false);
  });

  it("checkWished는 봉투 없이 204/404만으로 응답한다", async () => {
    await expect(checkWished(101)).resolves.toBe(true);
    await expect(checkWished(999999)).resolves.toBe(false);
  });

  it("fetchWishedIds는 전체 페이지를 순회해 id 집합을 모은다", async () => {
    const ids = await fetchWishedIds();
    expect(ids.has(101)).toBe(true);
    expect(ids.size).toBe(WISH_FIXTURES.length);
  });
});
