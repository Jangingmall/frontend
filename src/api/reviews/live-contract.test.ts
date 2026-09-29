import { http } from "msw";
import { expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { fetchMyReviews, fetchReviewableItems, fetchReviews } from "./api";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
const image = {
  imageId: "image-1",
  variants: [
    {
      url: "https://cdn.test/640.webp",
      width: 640,
      height: 640,
      format: "webp",
    },
  ],
};
const page = {
  number: 0,
  size: 5,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
  empty: false,
};
it("내 후기 ImageRef·레거시 이미지를 기존 사진 UI에 표시한다", async () => {
  server.use(
    http.get("*/api/member/me/reviews", () =>
      mockOk({
        ...page,
        content: [
          {
            reviewId: 1,
            productId: 2,
            orderItemId: 3,
            productName: "도자기",
            thumbnail: image,
            rating: 4.5,
            content: "좋아요",
            images: [image, { legacyImageUrl: "https://cdn.test/old.jpg" }],
            createdAt: "2026-09-25T10:00:00",
          },
        ],
      }),
    ),
  );
  const result = await fetchMyReviews(1);
  expect(result.items[0]).toMatchObject({
    rating: 4.5,
    thumbnailUrl: "https://cdn.test/640.webp",
    images: [
      { src: "https://cdn.test/640.webp" },
      { src: "https://cdn.test/old.jpg" },
    ],
  });
});
it("작성 가능한 후기의 실제 옵션 스냅샷과 null 썸네일을 수용한다", async () => {
  server.use(
    http.get("*/api/member/me/reviews/writable", () =>
      mockOk({
        ...page,
        content: [
          {
            orderItemId: 3,
            productId: 2,
            productName: "도자기",
            thumbnail: null,
            legacyThumbnailUrl: "https://cdn.test/old.jpg",
            options: {
              selectedOptions: [{ optionGroupId: 1, choiceId: 2 }],
              textInputs: [],
            },
            purchasedAt: "2026-09-25T10:00:00",
          },
        ],
      }),
    ),
  );
  expect(await fetchReviewableItems()).toMatchObject([
    { thumbnailUrl: "https://cdn.test/old.jpg", options: [] },
  ]);
});
it.each([true, false])(
  "API 모드에서 isMock=%s나 사진 필터로 시연 후기에 우회할 수 없다",
  async (isMock) => {
    server.use(
      http.get("*/api/products/2/reviews", () =>
        mockOk({
          ...page,
          content: [
            {
              reviewId: 1,
              productId: 2,
              writerId: 3,
              rating: 4.5,
              content: "좋아요",
              images: ["image-1"],
              createdAt: "2026-09-25T10:00:00",
            },
          ],
        }),
      ),
    );
    const result = await fetchReviews(
      2,
      { page: 1, sort: "latest", photoOnly: true },
      isMock,
    );
    expect(result.items[0]).toMatchObject({ rating: 4.5, images: [] });
  },
);
