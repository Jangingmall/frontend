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
      const filtered = products.filter(
        (item) =>
          (!p.get("keyword") || item.title.includes(p.get("keyword")!)) &&
          (!p.get("subcategoryId") ||
            item.subcategoryId === Number(p.get("subcategoryId"))),
      );
      return mockOk(
        mutate({
          content: filtered.slice(number * size, (number + 1) * size),
          number,
          size,
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size),
        }),
      );
    }),
  );
  return requests;
}
describe("현재 Pageable 목록 계약", () => {
  it("필터 없는 요청은 Spring 정렬과 한 페이지만 사용한다", async () => {
    const requests = mockPages();
    for (const fetchList of [fetchProductList, fetchProductListClient]) {
      const result = await fetchList({ page: 2, size: 20, sort: "price-asc" });
      expect(result.page).toBe(2);
      expect(result.items[0].rating).toBeNull();
    }
    expect(requests).toHaveLength(2);
    for (const p of requests) {
      expect([...p.keys()]).toEqual(["page", "size", "sort", "excludeSoldOut"]);
      expect(p.getAll("sort")).toEqual(["PRICE_ASC"]);
    }
  });
  it("검색 필터와 페이지를 서버에 보내고 한 페이지만 조회한다", async () => {
    const requests = mockPages();
    for (const fetchList of [fetchProductList, fetchProductListClient]) {
      const result = await fetchList({
        keyword: "백자",
        sort: "price-asc",
        size: 2,
        page: 2,
      });
      expect(result.totalCount).toBe(3);
      expect(result.items.map((i) => i.id)).toEqual([103]);
    }
    expect(requests).toHaveLength(2);
    expect(requests.every((p) => p.get("keyword") === "백자")).toBe(true);
  });
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
