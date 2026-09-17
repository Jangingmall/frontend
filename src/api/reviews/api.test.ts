import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
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
  it("실제 환경에서 지원하지 않는 사진 필터를 호출하지 않는다", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    await expect(
      fetchReviews(101, { page: 1, sort: "latest", photoOnly: true }, false),
    ).rejects.toThrow("사진");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    ["latest", "createdAt,desc"],
    ["high", "rating,desc"],
    ["low", "rating,asc"],
  ] as const)(
    "실제 Spring Page의 %s 정렬과 전체 건수를 사용한다",
    async (sort, apiSort) => {
      server.use(
        http.get("*/api/products/101/reviews", ({ request }) => {
          const search = new URL(request.url).searchParams;
          expect(search.get("page")).toBe("1");
          expect(search.get("size")).toBe("5");
          expect(search.getAll("sort")[0]).toBe(apiSort);
          expect(request.headers.has("authorization")).toBe(false);
          return mockOk({
            content: [
              {
                reviewId: 11,
                productId: 101,
                writerId: 4,
                orderItemId: 3,
                rating: 4,
                content: "실제 후기",
                createdAt: "2026-09-10T15:00:00",
              },
            ],
            number: 1,
            size: 5,
            totalElements: 6,
            totalPages: 2,
          });
        }),
      );
      const result = await fetchReviews(
        101,
        { page: 2, sort, photoOnly: false },
        false,
      );
      expect(result).toMatchObject({
        totalCount: 6,
        reviewCount: 6,
        rating: null,
        items: [{ id: 11, body: "실제 후기", images: [], optionLabel: "" }],
      });
    },
  );
});
