import { describe, expect, it } from "vitest";

import {
  fetchHomeDemoBest,
  fetchHomeDemoPromotions,
} from "@/api/home/demo-server";

describe("homeHandlers", () => {
  it("베스트와 기획전에 별도의 프론트 MSW 상품 목록을 반환한다", async () => {
    const [best, promotions] = await Promise.all([
      fetchHomeDemoBest(),
      fetchHomeDemoPromotions(),
    ]);

    expect(best.items).toHaveLength(5);
    expect(best.items.map((item) => item.name)).toEqual([
      "전통 한지 무드등",
      "옥 매듭 반지",
      "옻칠 원형 쟁반",
      "청자 분청 찻잔",
      "왕골 원형 부채",
    ]);
    expect(promotions).toHaveLength(4);
    expect(promotions).toMatchObject([
      {
        name: "대나무 조명",
        artisan: { name: "김조명" },
        price: 500000,
        thumbnailUrl: "/home-products/promotion-bamboo-lamp.jpg",
        colors: [{ hex: "#C18B4C" }],
      },
      {
        name: "백잔",
        artisan: { name: "이백잔" },
        price: 100000,
        thumbnailUrl: "/home-products/promotion-white-cup.jpg",
        colors: [{ hex: "#FFFFFF" }],
      },
      {
        name: "오배자염 테이블러너",
        artisan: { name: "오자염" },
        price: 140000,
        thumbnailUrl: "/home-products/promotion-table-runner.jpg",
        colors: [{ hex: "#9A8D8B" }, { hex: "#A86062" }, { hex: "#648570" }],
      },
      {
        name: "산수화 대형 부채",
        artisan: { name: "임산수" },
        price: 85000,
        thumbnailUrl: "/home-products/promotion-landscape-fan.jpg",
        colors: [{ hex: "#DCD6C5" }, { hex: "#FFFFFD" }],
      },
    ]);
  });
});
