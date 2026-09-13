import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mapProductListPage } from "@/api/products/mapper";
import { productListPage1 } from "@/api/products/mock/fixtures";

vi.mock("@/api/products/api", () => ({
  fetchProductList: vi.fn(),
}));

import { fetchProductList } from "@/api/products/api";

import HomePage from "./page";

describe("HomePage", () => {
  it("히어로 → 베스트 → 선물 → 장인관 → 신상품 → 기획전 순서로 섹션을 조립한다", async () => {
    vi.mocked(fetchProductList).mockResolvedValue(
      mapProductListPage(productListPage1, { page: 1, size: 5 }),
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
  });

  it("베스트·신상품 조회에 실패해도 나머지 섹션은 렌더링한다", async () => {
    vi.mocked(fetchProductList).mockRejectedValue(new Error("network"));
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        {await HomePage()}
      </QueryClientProvider>,
    );

    const sections = screen.getAllByRole("region");
    // 베스트·신상품은 서버 조회 실패로 숨는다. 선물 섹션은 헤더·테마 토글이 항상
    // 보이는 구조라(카드만 클라이언트에서 다시 조회) 서버 조회 실패와 무관하게 남는다.
    expect(
      sections.map((section) => section.getAttribute("aria-label")),
    ).toEqual(["히어로", "선물", "장인관", "기획전"]);
  });
});
