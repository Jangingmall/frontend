import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { mapProductListPage } from "@/api/products/mapper";
import { productListPage1 } from "@/api/products/mock/fixtures";
import { mockPaged } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { GiftSection } from "./GiftSection";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("GiftSection", () => {
  it("initialData로 첫 페인트를 채운다", () => {
    const initialData = mapProductListPage(productListPage1, {
      page: 1,
      size: 3,
    });
    renderWithClient(
      <GiftSection initialTheme="housewarming" initialData={initialData} />,
    );
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
  });

  it("전체보기는 선물 프리셋 목록으로 링크한다", () => {
    renderWithClient(<GiftSection initialTheme="housewarming" />);
    expect(screen.getByRole("link", { name: "전체보기" })).toHaveAttribute(
      "href",
      "/products?preset=gift",
    );
  });

  it("테마를 바꾸면 그 테마의 추천 상품으로 갱신된다", async () => {
    server.use(
      http.get("*/api/products", ({ request }) => {
        const theme = new URL(request.url).searchParams.get("giftTheme");
        return mockPaged(
          theme === "WEDDING"
            ? [productListPage1.items[1]]
            : [productListPage1.items[0]],
        );
      }),
    );
    renderWithClient(<GiftSection initialTheme="housewarming" />);

    await waitFor(() =>
      expect(screen.getByText("백자 달항아리")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("tab", { name: "웨딩 · 혼수" }));

    await waitFor(() =>
      expect(screen.getByText("옻칠 3단 찬합")).toBeInTheDocument(),
    );
  });

  it("이 테마에 상품이 없으면 안내 문구를 보여준다", async () => {
    server.use(http.get("*/api/products", () => mockPaged([])));
    renderWithClient(<GiftSection initialTheme="housewarming" />);

    await waitFor(() =>
      expect(
        screen.getByText("이 테마에 맞는 상품이 아직 없어요."),
      ).toBeInTheDocument(),
    );
  });
});
