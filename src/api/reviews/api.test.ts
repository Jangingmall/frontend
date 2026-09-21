import { http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import {
  createReview,
  fetchMyReviews,
  fetchReviewableItems,
  fetchReviews,
} from "./api";
import { MY_REVIEW_FIXTURES } from "./mock/fixtures";
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

describe("마이페이지 후기 목록·작성", () => {
  beforeEach(() => server.use(...reviewHandlers));

  it("리뷰 미작성 + 배송완료 주문 아이템을 보여준다", async () => {
    const items = await fetchReviewableItems();
    expect(items.some((item) => item.orderItemId === 9003)).toBe(true);
    expect(items.every((item) => item.rewardPoints === 100)).toBe(true);
  });

  it("내가 작성한 후기를 5건씩 페이지네이션한다", async () => {
    const first = await fetchMyReviews(1);
    const second = await fetchMyReviews(2);
    expect(first.totalCount).toBe(MY_REVIEW_FIXTURES.length);
    expect(first.items).toHaveLength(5);
    expect(second.items.length).toBeGreaterThan(0);
  });

  it("후기를 작성하면 목록 맨 앞에 추가되고 해당 아이템이 리뷰작성 대상에서 빠진다", async () => {
    await createReview(1003, {
      orderItemId: 9003,
      rating: 4.5,
      content: "테스트 후기입니다.",
      images: [],
    });
    const myReviews = await fetchMyReviews(1);
    expect(myReviews.items[0]).toMatchObject({
      orderItemId: 9003,
      rating: 4.5,
      content: "테스트 후기입니다.",
    });
    const reviewable = await fetchReviewableItems();
    expect(reviewable.some((item) => item.orderItemId === 9003)).toBe(false);
  });

  it("이미 작성한 아이템에 다시 작성하면 거부한다", async () => {
    await expect(
      createReview(1003, {
        orderItemId: 9003,
        rating: 3,
        content: "두 번째 시도",
        images: [],
      }),
    ).rejects.toThrow();
  });
});
