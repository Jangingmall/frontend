import { delay, http } from "msw";
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

it("잘못된 썸네일만 기본 이미지로 대체하고 상품과 전체 개수를 유지한다", async () => {
  const thumbnails = [
    "전남 담양",
    "경기 남양주",
    "송화가루 흑임자",
    "javascript:alert(1)",
    "//example.com/image.jpg",
    "",
    null,
    "/images/product-placeholder.png",
    "https://example.com/product.jpg",
  ];
  mockPages((page) => ({
    ...page,
    content: (page.content as typeof products).map((product, index) => ({
      ...product,
      thumbnailUrl: thumbnails[index % thumbnails.length],
    })),
  }));
  for (const fetchList of [fetchProductList, fetchProductListClient]) {
    const result = await fetchList({});
    expect(result.totalCount).toBe(103);
    expect(result.items).toHaveLength(20);
    expect(result.items.slice(0, 7).map((item) => item.thumbnailUrl)).toEqual(
      Array(7).fill(null),
    );
    expect(result.items[7].thumbnailUrl).toBe(
      "/images/product-placeholder.png",
    );
    expect(result.items[8].thumbnailUrl).toBe(
      "https://example.com/product.jpg",
    );
    expect(result.items[0]).toMatchObject({ id: 1, name: "접시", price: 104 });
  }
});

it("썸네일을 허용해도 잘못된 상품 가격은 거부한다", async () => {
  mockPages((page) => ({
    ...page,
    content: (page.content as typeof products).map((product) => ({
      ...product,
      price: -1,
    })),
  }));
  await expect(fetchProductListClient({})).rejects.toThrow();
});

it("미지원 필터를 직접 넘겨도 서버와 클라이언트는 실제 목록만 조회한다", async () => {
  const requests = mockPages();
  for (const fetchList of [fetchProductList, fetchProductListClient]) {
    await fetchList({
      sort: "sales",
      materials: ["WOOD"],
      crafts: ["SAGI"],
      hasGiftWrap: true,
    });
  }
  expect(requests).toHaveLength(2);
  for (const params of requests) {
    expect(params.get("page")).toBe("0");
    expect(params.get("sort")).toBe("NEWEST");
    expect(params.has("material")).toBe(false);
    expect(params.has("subcategory")).toBe(false);
    expect(params.has("hasGiftWrap")).toBe(false);
  }
});

it("서버 분류 조회는 categories와 subcategories를 병렬로 요청한다", async () => {
  let markSubcategoriesRequested!: () => void;
  const subcategoriesRequested = new Promise<true>((resolve) => {
    markSubcategoriesRequested = () => resolve(true);
  });
  let requestedWhileCategoriesPending = false;
  server.use(
    http.get("*/api/products/categories", async () => {
      // 직렬이면 categories 응답 전에는 subcategories 요청이 시작되지 않는다.
      requestedWhileCategoriesPending = await Promise.race([
        subcategoriesRequested,
        delay(500).then(() => false),
      ]);
      return mockOk([{ categoryId: 1, name: "도자기" }]);
    }),
    http.get("*/api/products/subcategories", () => {
      markSubcategoriesRequested();
      return mockOk([{ subcategoryId: 2, categoryId: 1, name: "찻잔" }]);
    }),
  );

  await fetchProductCategoriesServer();

  expect(requestedWhileCategoriesPending).toBe(true);
});
