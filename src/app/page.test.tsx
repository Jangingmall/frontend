import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapProductListPage } from "@/api/products/mapper";
import { productListPage1 } from "@/api/products/mock/fixtures";

const { testEnv } = vi.hoisted(() => ({ testEnv: { apiMocking: true } }));
vi.mock("@/lib/env", () => ({ publicEnv: testEnv }));
vi.mock("@/api/products/api", () => ({
  fetchProductList: vi.fn(),
}));
vi.mock("@/api/home/demo-server", () => ({
  fetchHomeDemoBest: vi.fn(),
  fetchHomeDemoPromotions: vi.fn(),
  fetchHomeDemoArtisans: vi.fn().mockResolvedValue([]),
  fetchHomeDemoGifts: vi.fn().mockResolvedValue({
    items: [],
    page: 1,
    pageSize: 3,
    totalCount: 0,
    totalPages: 0,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import {
  fetchHomeDemoBest,
  fetchHomeDemoPromotions,
} from "@/api/home/demo-server";
import { fetchProductList } from "@/api/products/api";

import HomePage from "./page";

describe.each([false, true])("HomePage (apiMocking=%s)", (apiMocking) => {
  beforeEach(() => {
    vi.clearAllMocks();
    testEnv.apiMocking = apiMocking;
  });
  it("히어로 → 베스트 → 선물 → 장인관 → 신상품 → 기획전 순서로 섹션을 조립한다", async () => {
    vi.mocked(fetchProductList).mockResolvedValue(
      mapProductListPage(productListPage1, { page: 1, size: 5 }),
    );
    vi.mocked(fetchHomeDemoBest).mockResolvedValue(
      mapProductListPage(productListPage1, { page: 1, size: 5 }),
    );
    vi.mocked(fetchHomeDemoPromotions).mockResolvedValue(
      mapProductListPage(productListPage1, { page: 1, size: 5 }).items,
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        {await HomePage()}
      </QueryClientProvider>,
    );

    const sections = screen.getAllByRole("region");
    expect(
      sections.map((section) => section.getAttribute("aria-label")),
    ).toEqual(["히어로", "베스트", "선물", "장인관", "신상품", "기획전"]);
    expect(fetchProductList).toHaveBeenCalledTimes(1);
    expect(fetchProductList).toHaveBeenCalledWith({ sort: "newest", size: 4 });
    expect(screen.queryByText("베스트 상품 시연")).not.toBeInTheDocument();
    expect(screen.queryByText("기획전 시연")).not.toBeInTheDocument();
    expect(fetchHomeDemoBest).toHaveBeenCalledOnce();
    expect(fetchHomeDemoPromotions).toHaveBeenCalledOnce();
  });

  it("신상품 API 조회가 실패해도 MSW 베스트·기획전은 렌더링한다", async () => {
    vi.mocked(fetchProductList).mockRejectedValue(new Error("network"));
    vi.mocked(fetchHomeDemoBest).mockResolvedValue(
      mapProductListPage(productListPage1, { page: 1, size: 5 }),
    );
    vi.mocked(fetchHomeDemoPromotions).mockResolvedValue(
      mapProductListPage(productListPage1, { page: 1, size: 5 }).items,
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        {await HomePage()}
      </QueryClientProvider>,
    );

    const sections = screen.getAllByRole("region");
    // 신상품만 실제 API 조회 실패로 숨는다. 베스트·기획전은 프론트 MSW 데이터로 유지된다.
    expect(
      sections.map((section) => section.getAttribute("aria-label")),
    ).toEqual(["히어로", "베스트", "선물", "장인관", "기획전"]);
  });
});
