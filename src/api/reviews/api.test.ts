import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";

import { fetchReviews } from "./api";
import { reviewHandlers } from "./mock/handlers";

describe("상품 후기", () => {
  beforeEach(() => server.use(...reviewHandlers));
  it("다섯 개씩 조회하고 사진 필터와 평점 정렬을 적용한다", async () => {
    const first = await fetchReviews(
      101,
      { page: 1, sort: "latest", photoOnly: false },
      true,
    );
    const second = await fetchReviews(
      101,
      { page: 2, sort: "latest", photoOnly: false },
      true,
    );
    expect(first.totalCount).toBe(12);
    expect(first.items).toHaveLength(5);
    expect(
      second.items.every((item) =>
        first.items.every((other) => other.id !== item.id),
      ),
    ).toBe(true);
    const photos = await fetchReviews(
      101,
      { page: 1, sort: "high", photoOnly: true },
      true,
    );
    expect(photos.items.every((item) => item.images.length > 0)).toBe(true);
    expect(photos.items.map((item) => item.rating)).toEqual(
      photos.items.map((item) => item.rating).sort((a, b) => b - a),
    );
    expect(photos.reviewCount).toBe(12);
  });
  it("후기가 없을 때 평균을 0으로 꾸미지 않는다", async () => {
    const result = await fetchReviews(
      102,
      { page: 1, sort: "latest", photoOnly: false },
      true,
    );
    expect(result).toMatchObject({ items: [], totalCount: 0, rating: null });
  });
  it("실제 환경에서 미확정 API를 호출하지 않는다", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    await expect(
      fetchReviews(101, { page: 1, sort: "latest", photoOnly: false }, false),
    ).rejects.toThrow("준비 중");
    expect(fetch).not.toHaveBeenCalled();
  });
});
