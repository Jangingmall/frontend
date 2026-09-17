import { http } from "msw";
import { expect, it, vi } from "vitest";

import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { fetchProductDetail } from "./detail-api";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
const product = {
  productId: 201,
  artisanId: 21,
  title: "작품",
  description: "소개",
  price: 10000,
  stock: 3,
  thumbnailUrl: null,
  status: "ON_SALE",
  productionPeriodDays: 5,
};

it("combines public product and existing artisan detail without mock extensions", async () => {
  server.use(
    http.get("*/api/products/201", () => mockOk(product)),
    http.get("*/api/member/artisans/21", ({ request }) => {
      expect(request.headers.has("authorization")).toBe(false);
      return mockOk({
        artisanId: 21,
        businessName: "도예 공방",
        introduction: "공방 소개",
        profileImageUrl: null,
        category: "도자기",
      });
    }),
  );
  expect(await fetchProductDetail(201)).toMatchObject({
    id: 201,
    artisan: {
      id: 21,
      name: "도예 공방",
      craft: "도자기",
      introduction: "공방 소개",
      image: null,
      href: null,
    },
    shipping: { productionDays: "5일" },
    optionGroups: [],
    isMock: false,
  });
});

it("keeps product information when optional artisan detail is unavailable", async () => {
  server.use(
    http.get("*/api/products/201", () => mockOk(product)),
    http.get("*/api/member/artisans/21", () =>
      mockError(404, "NOT_FOUND", "없음"),
    ),
  );
  expect(await fetchProductDetail(201)).toMatchObject({
    id: 201,
    artisan: null,
  });
});
