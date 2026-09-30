import { describe, expect, it, vi } from "vitest";

import {
  fetchProductCategories,
  fetchProductCrafts,
  fetchProductListClient,
  fetchProductMaterials,
} from "./client";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

describe("상품 목록 공개 조회", () => {
  it("실제 종목 응답의 숫자 ID를 화면용 문자열 ID로 변환한다", async () => {
    expect(await fetchProductCrafts()).toEqual(
      expect.arrayContaining([{ id: "1", name: "사기장" }]),
    );
  });
  it("종목끼리는 OR로 합치고 소재·가격·포장과 AND로 조합한다", async () => {
    const first = await fetchProductListClient({
      category: "kitchen-1",
      crafts: ["1"],
    });
    const second = await fetchProductListClient({
      category: "kitchen-1",
      crafts: ["2"],
    });
    const combined = await fetchProductListClient({
      category: "kitchen-1",
      crafts: ["1", "2"],
    });
    expect(first.totalCount).toBeGreaterThan(0);
    expect(second.totalCount).toBeGreaterThan(0);
    expect(combined.totalCount).toBe(first.totalCount + second.totalCount);
    expect(combined.items.map((item) => item.id).sort()).toEqual(
      [...first.items, ...second.items].map((item) => item.id).sort(),
    );
    const filtered = await fetchProductListClient({
      category: "kitchen-1",
      crafts: ["1", "2"],
      materials: ["ceramic"],
      minPrice: 20000,
      maxPrice: 200000,
      hasGiftWrap: true,
    });
    expect(filtered.items.map((item) => item.id)).toEqual([101]);
    expect(
      (
        await fetchProductListClient({
          category: "kitchen-1",
          crafts: ["missing"],
        })
      ).totalCount,
    ).toBe(0);
  });
  it("카테고리 및 소재 선택지를 조회한다", async () => {
    expect(await fetchProductCategories()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "category-1",
          name: "키친 · 다이닝",
          parentId: null,
        }),
        expect.objectContaining({
          id: "subcategory-1",
          name: "다기 · 찻잔",
          parentId: "category-1",
        }),
      ]),
    );
    expect(await fetchProductMaterials()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "wood" })]),
    );
  });
  it("MSW 모드도 실서버와 같은 분류 ID로 조회하고, 시연 카탈로그에 없는 분류는 오류로 거절한다", async () => {
    const kitchen = await fetchProductListClient({ category: "category-1" });
    expect(kitchen.totalCount).toBe(140);
    const teaware = await fetchProductListClient({
      category: "subcategory-1",
    });
    expect(teaware.totalCount).toBeGreaterThan(0);
    expect(teaware.totalCount).toBeLessThan(kitchen.totalCount);

    await expect(
      fetchProductListClient({ category: "category-2" }),
    ).rejects.toMatchObject({ status: 422 });
  });
  it("필터와 가격 정렬을 적용하고 총 개수를 유지하며 페이지를 나눈다", async () => {
    const query = {
      category: "kitchen",
      excludeSoldOut: true,
      materials: ["wood"],
      sort: "price-asc" as const,
      size: 2,
    };
    const first = await fetchProductListClient(query);
    const second = await fetchProductListClient({ ...query, page: 2 });
    expect(first.totalCount).toBeGreaterThan(2);
    expect(first.items).toHaveLength(2);
    expect(second.totalCount).toBe(first.totalCount);
    expect(first.items[1].price).toBeLessThanOrEqual(second.items[0].price);
    expect(first.items.every((product) => !product.isSoldOut)).toBe(true);
    expect(first.items[0].id).not.toBe(second.items[0].id);
  });
  it("범위를 벗어난 가격은 빈 목록을 반환한다", async () => {
    expect(
      (await fetchProductListClient({ minPrice: 999999999 })).items,
    ).toEqual([]);
  });
});
