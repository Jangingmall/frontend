import { http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publicEnv } from "@/lib/env";
import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { fetchProductCategoriesServer, fetchProductList } from "./api";
import {
  fetchProductCategories,
  fetchProductCrafts,
  fetchProductListClient,
  fetchProductMaterials,
} from "./client";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: false, productListApi: true },
}));

// ProductResponse + Spring Page: BE develop abd42e3의 응답 구조. 확장 메타데이터를 만들지 않는다.
const backendPage = {
  content: [
    {
      productId: 71,
      artisanId: 8,
      categoryId: 1,
      categoryName: "도자기",
      subcategoryId: 2,
      subcategoryName: "찻잔",
      title: "백자 찻잔",
      description: "수작업 찻잔",
      price: 25000,
      stock: 3,
      thumbnailUrl: "https://images.example.com/cup.jpg",
      status: "ON_SALE",
      createdAt: "2026-09-17T00:00:00",
      updatedAt: "2026-09-17T00:00:00",
      giftThemes: [],
      purposeTags: [],
      productionPeriodDays: 7,
      colors: ["WHITE"],
    },
  ],
  number: 1,
  size: 10,
  totalElements: 23,
  totalPages: 3,
  first: false,
  last: false,
  empty: false,
};

// Notion code/name 선택지의 준비용 예시. 이 코드값 및 종목 의미는 아직 BE 확정값이 아니다.
const categories = [
  { code: "KITCHEN", name: "키친·다이닝" },
  { code: "TEA", name: "다기·찻잔" },
];

afterEach(() => {
  Object.assign(publicEnv, { productListApi: true });
});

describe("BE 연결 준비", () => {
  it("서버·브라우저가 0-based 요청을 보내고 응답의 페이지와 실제 상품 필드를 사용한다", async () => {
    const requests: string[] = [];
    server.use(
      http.get("*/api/products", ({ request }) => {
        requests.push(request.url);
        return mockOk(backendPage);
      }),
    );
    for (const fetchList of [fetchProductList, fetchProductListClient]) {
      const result = await fetchList({ page: 2, size: 20 });
      expect(result).toMatchObject({
        page: 2,
        pageSize: 10,
        totalPages: 3,
        totalCount: 23,
      });
      expect(result.items[0]).toMatchObject({
        id: 71,
        name: "백자 찻잔",
        price: 25000,
        thumbnailUrl: "https://images.example.com/cup.jpg",
        artisan: { id: 8, name: null },
        rating: null,
        reviewCount: null,
        primaryBadge: null,
      });
      expect(result.items[0].thumbnail).toBeNull();
    }
    expect(requests).toHaveLength(2);
    expect(
      requests.every((url) => new URL(url).searchParams.get("page") === "1"),
    ).toBe(true);
  });

  it("준비 설정이 꺼져 있으면 서버·브라우저가 미지원 필터를 실제 서버에 보내지 않는다", async () => {
    Object.assign(publicEnv, { productListApi: false });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (const request of [
      () => fetchProductList({}),
      () => fetchProductListClient({}),
      () => fetchProductCategories(),
      () => fetchProductCategoriesServer(),
      () => fetchProductMaterials("다기-찻잔"),
      () => fetchProductCrafts("다기-찻잔"),
    ]) {
      await expect(request()).rejects.toMatchObject({
        code: "PRODUCT_LIST_API_NOT_READY",
      });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("서버·브라우저 분류 조회는 GNB를 보존하지만 같은 이름만으로 코드를 연결하지 않는다", async () => {
    server.use(http.get("*/api/products/categories", () => mockOk(categories)));
    const mapped = await fetchProductCategories();
    expect(mapped).toEqual(await fetchProductCategoriesServer());
    expect(mapped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "키친-다이닝",
          parentId: null,
          apiCode: undefined,
        }),
        expect.objectContaining({
          id: "다기-찻잔",
          parentId: "키친-다이닝",
          apiCode: undefined,
        }),
      ]),
    );
  });

  it.each([
    { response: [{ categoryId: 1, name: "도자기" }] },
    { response: categories },
  ])(
    "미확정 분류를 전체 조회로 바꾸지 않고 서버·브라우저 모두 차단한다: $response",
    async ({ response }) => {
      let listCalls = 0;
      server.use(
        http.get("*/api/products/categories", () => mockOk(response)),
        http.get("*/api/products", () => {
          listCalls++;
          return mockOk(backendPage);
        }),
      );
      for (const fetchList of [fetchProductList, fetchProductListClient]) {
        await expect(
          fetchList({ category: "다기-찻잔" }),
        ).rejects.toMatchObject({
          code: "PRODUCT_CATEGORY_NOT_MAPPED",
        });
      }
      expect(listCalls).toBe(0);
    },
  );

  it("목록 설정을 켜도 서버·브라우저 요청에서 미지원 소재·종목은 제외한다", async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get("*/api/products", ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return mockOk(backendPage);
      }),
    );
    for (const fetchList of [fetchProductList, fetchProductListClient]) {
      await fetchList({ crafts: ["SAGI"], materials: ["WOOD"] });
    }
    expect(requests).toHaveLength(2);
    for (const params of requests) {
      expect(params.has("subcategory")).toBe(false);
      expect(params.has("material")).toBe(false);
    }
  });

  it("비공개 상품·잘못된 가격·잘못된 페이지 응답은 화면에 전달하지 않는다", async () => {
    for (const payload of [
      {
        ...backendPage,
        content: [{ ...backendPage.content[0], status: "DRAFT" }],
      },
      { ...backendPage, content: [{ ...backendPage.content[0], price: -1 }] },
      { ...backendPage, size: 0 },
    ]) {
      server.use(http.get("*/api/products", () => mockOk(payload)));
      await expect(fetchProductListClient({})).rejects.toThrow();
    }
  });

  it("BE가 빈 페이지를 반환하면 표시 모델의 페이지 수만 최소 1로 맞춘다", async () => {
    server.use(
      http.get("*/api/products", () =>
        mockOk({
          ...backendPage,
          content: [],
          number: 0,
          totalElements: 0,
          totalPages: 0,
        }),
      ),
    );
    expect(await fetchProductListClient({})).toMatchObject({
      items: [],
      page: 1,
      totalCount: 0,
      totalPages: 1,
    });
  });
});
