import { describe, expect, it } from "vitest";

import {
  fetchProductCategories,
  fetchProductListClient,
  fetchProductMaterials,
} from "./client";

describe("상품 목록 공개 조회", () => {
  it("카테고리 및 소재 선택지를 조회한다", async () => {
    expect(await fetchProductCategories()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "kitchen", parentId: null }),
      ]),
    );
    expect(await fetchProductMaterials()).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "wood" })]),
    );
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
