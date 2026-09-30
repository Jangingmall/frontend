import { getResponse, http, HttpHandler } from "msw";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { setServerMockResolver } from "@/lib/http/server-mock";
import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import {
  fetchDemoProductCrafts,
  fetchProductCatalogueClient as fetchProductListClient,
} from "./catalogue-client";
import { fetchProductCatalogue as fetchProductList } from "./catalogue-server";
import { fetchProductMaterials } from "./client";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
beforeEach(() =>
  setServerMockResolver(async (request) =>
    new URL(request.url).pathname.startsWith("/api/mock/")
      ? getResponse(
          server
            .listHandlers()
            .filter(
              (handler): handler is HttpHandler =>
                handler instanceof HttpHandler,
            ),
          request,
        )
      : undefined,
  ),
);
afterEach(() => setServerMockResolver(async () => undefined));
it.each([fetchProductList, fetchProductListClient])(
  "판매량 정렬은 시연 상품이며 실제 상품 목록을 호출하지 않는다",
  async (fetchList) => {
    const live = vi.fn();
    server.use(
      http.get("*/api/products", () => {
        live();
        return mockOk({});
      }),
    );
    const result = await fetchList({ sort: "sales", size: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.items.every((item) => item.isDemo)).toBe(true);
    expect(live).not.toHaveBeenCalled();
  },
);
it("공예 종목은 시연 선택지로 복원한다", async () => {
  const result = await fetchDemoProductCrafts();
  expect(result.length).toBeGreaterThan(0);
});
it("소재 선택지는 기존 실제 API 경로와 실제 빈 응답을 유지한다", async () => {
  server.use(
    http.get("*/api/products/materials", ({ request }) => {
      expect(new URL(request.url).searchParams.get("subcategoryId")).toBe("1");
      return mockOk([]);
    }),
  );
  expect(await fetchProductMaterials("subcategory-1")).toEqual([]);
});

it("정적 홈 빌드처럼 instrumentation이 없는 환경에서도 시연 카탈로그를 렌더링한다", async () => {
  setServerMockResolver(async () => undefined);
  const live = vi.spyOn(globalThis, "fetch");
  const result = await fetchProductList({ sort: "sales", size: 5 });
  expect(result.items).toHaveLength(5);
  expect(result.items.every((item) => item.isDemo)).toBe(true);
  expect(live).not.toHaveBeenCalled();
});
