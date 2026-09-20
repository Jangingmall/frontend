import { http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { productKeys } from "@/queries/products/keys";

import { fetchProductCategoriesServer, fetchProductList } from "./api";
import { fetchProductCategories, fetchProductListClient } from "./client";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
const products = Array.from({ length: 103 }, (_, index) => ({
  productId: index + 1,
  artisanId: 8,
  categoryId: 1,
  categoryName: "도자기",
  subcategoryId: index < 100 ? 2 : 3,
  subcategoryName: "찻잔",
  title: index < 100 ? "접시" : "백자 찻잔",
  description: null,
  price: 104 - index,
  stock: 3,
  thumbnailUrl: null,
  status: "ON_SALE",
  createdAt: "2026-09-17T00:00:00",
  updatedAt: "2026-09-17T00:00:00",
  giftThemes: [],
  purposeTags: [],
  productionPeriodDays: null,
  colors: [],
}));
function mockPages(mutate = (page: Record<string, unknown>) => page) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get("*/api/products", ({ request }) => {
      const p = new URL(request.url).searchParams;
      requests.push(p);
      const number = Number(p.get("page")),
        size = Number(p.get("size"));
      return mockOk(
        mutate({
          content: products.slice(number * size, (number + 1) * size),
          number,
          size,
          totalElements: 103,
          totalPages: Math.ceil(103 / size),
        }),
      );
    }),
  );
  return requests;
}
describe("현재 Pageable 목록 계약", () => {
  it("인기순을 POPULAR로 전송하고 필터·페이지 적용 후에도 서버 순서를 유지한다", async () => {
    const requests: URLSearchParams[] = [];
    const ranked = [...products].reverse();
    server.use(
      http.get("*/api/products", ({ request }) => {
        const params = new URL(request.url).searchParams;
        requests.push(params);
        const number = Number(params.get("page"));
        const size = Number(params.get("size"));
        return mockOk({
          content: ranked.slice(number * size, (number + 1) * size),
          number,
          size,
          totalElements: ranked.length,
          totalPages: Math.ceil(ranked.length / size),
        });
      }),
    );
    for (const fetchList of [fetchProductList, fetchProductListClient]) {
      const unfiltered = await fetchList({ sort: "popular", size: 2 });
      expect(unfiltered.items.map((item) => item.id)).toEqual([103, 102]);
      const filtered = await fetchList({
        sort: "popular",
        keyword: "백자",
        size: 2,
      });
      expect(filtered.items.map((item) => item.id)).toEqual([103, 102]);
      const nextPage = await fetchList({
        sort: "popular",
        keyword: "백자",
        size: 2,
        page: 2,
      });
      expect(nextPage.items.map((item) => item.id)).toEqual([101]);
    }
    expect(requests).toHaveLength(10);
    for (const params of requests)
      expect(params.getAll("sort")).toEqual(["POPULAR"]);
  });
  it("필터 없는 요청은 Spring 정렬과 한 페이지만 사용한다", async () => {
    const requests = mockPages();
    for (const fetchList of [fetchProductList, fetchProductListClient]) {
      const result = await fetchList({ page: 2, size: 20, sort: "price-asc" });
      expect(result.page).toBe(2);
      expect(result.items[0].rating).toBeNull();
    }
    expect(requests).toHaveLength(2);
    for (const p of requests) {
      expect([...p.keys()]).toEqual(["page", "size", "sort", "sort"]);
      expect(p.getAll("sort")).toEqual(["price,asc", "id,asc"]);
    }
  });
  it("검색은 전체 페이지를 모은 뒤 정렬과 페이지를 적용한다", async () => {
    const requests = mockPages();
    for (const fetchList of [fetchProductList, fetchProductListClient]) {
      const result = await fetchList({
        keyword: "백자",
        sort: "price-asc",
        size: 2,
        page: 2,
      });
      expect(result.totalCount).toBe(3);
      expect(result.items.map((i) => i.id)).toEqual([101]);
    }
    expect(requests).toHaveLength(4);
    expect(requests.every((p) => !p.has("keyword"))).toBe(true);
  });
  it.each(["total", "duplicate", "short"])(
    "불완전한 스캔 %s 는 실패한다",
    async (kind) => {
      mockPages((p) =>
        p.number === 1
          ? {
              ...p,
              ...(kind === "total"
                ? { totalElements: 104 }
                : kind === "duplicate"
                  ? { content: [products[0], products[101], products[102]] }
                  : { content: [] }),
            }
          : p,
      );
      await expect(
        fetchProductListClient({ keyword: "백자" }),
      ).rejects.toThrow();
    },
  );
  it("실제 분류와 품목을 같은 이름의 GNB에 억지로 연결하지 않는다", async () => {
    server.use(
      http.get("*/api/products/categories", () =>
        mockOk([{ categoryId: 1, name: "도자기" }]),
      ),
      http.get("*/api/products/subcategories", () =>
        mockOk([{ subcategoryId: 3, categoryId: 1, name: "찻잔" }]),
      ),
    );
    for (const fetchCategories of [
      fetchProductCategories,
      fetchProductCategoriesServer,
    ])
      expect(await fetchCategories()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "category-1",
            name: "도자기",
            parentId: null,
          }),
          expect.objectContaining({
            id: "subcategory-3",
            name: "찻잔",
            parentId: "category-1",
          }),
        ]),
      );
    mockPages();
    expect(
      (await fetchProductListClient({ category: "subcategory-3" })).totalCount,
    ).toBe(3);
    await expect(
      fetchProductListClient({ category: "다기-찻잔" }),
    ).rejects.toThrow();
  });
  it("FE 필터의 캐시를 서로 구분한다", () =>
    expect(productKeys.list({ keyword: "백자" })).not.toEqual(
      productKeys.list({ keyword: "접시" }),
    ));
});
it("잘못된 단일 페이지 번호와 길이를 거부한다", async () => {
  mockPages((p) => ({ ...p, number: 8 }));
  await expect(fetchProductListClient({})).rejects.toThrow();
  mockPages((p) => ({ ...p, content: [] }));
  await expect(fetchProductListClient({})).rejects.toThrow();
});
it("가격과 선물 테마를 전체 데이터에 적용하고 nullable 분류도 처리한다", async () => {
  mockPages((p) => ({
    ...p,
    content: (p.content as typeof products).map((item) => ({
      ...item,
      categoryId: null,
      categoryName: null,
      subcategoryId: null,
      subcategoryName: null,
      giftThemes: item.productId >= 101 ? ["HOUSEWARMING"] : [],
    })),
  }));
  const result = await fetchProductListClient({
    giftTheme: "housewarming",
    minPrice: 2,
    maxPrice: 3,
    sort: "price-desc",
  });
  expect(result.items.map((item) => item.id)).toEqual([102, 103]);
  expect(result.totalCount).toBe(2);
});
