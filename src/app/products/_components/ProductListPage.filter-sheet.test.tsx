import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { mapBackendProductCategories } from "@/api/products/backend-mapper";
import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductListPage } from "./ProductListPage";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: false, productListApi: true },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ push: vi.fn() }),
}));

const previousUrl = window.location.href;

afterEach(() => {
  window.history.replaceState(null, "", previousUrl);
  Reflect.deleteProperty(window, "matchMedia");
});

function renderPage(search: string) {
  window.history.replaceState(null, "", `/products?${search}`);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <ProductListPage
        initialQuery={parseProductSearchParams(
          new URLSearchParams(window.location.search),
        )}
        initialCategories={mapBackendProductCategories([
          { categoryId: 1, name: "도자기" },
        ])}
        initialData={{
          items: [],
          page: 2,
          pageSize: 20,
          totalCount: 0,
          totalPages: 1,
        }}
      />
    </QueryClientProvider>,
  );
  return {
    ...view,
    cleanup() {
      view.unmount();
      client.clear();
    },
  };
}

it("필터 버튼으로 시트를 열고 확인하면 URL이 갱신되며 1페이지로 돌아가고 시트가 닫힌다", async () => {
  const user = userEvent.setup();
  const { cleanup } = renderPage("category=category-1&page=2&minPrice=5000");
  try {
    await user.click(await screen.findByRole("button", { name: "필터" }));
    expect(screen.getByRole("dialog", { name: "필터" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "확인" }));
    const params = new URLSearchParams(window.location.search);
    expect(params.get("category")).toBe("category-1");
    expect(params.get("minPrice")).toBe("5000");
    expect(params.has("page")).toBe(false);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  } finally {
    cleanup();
  }
});

it("분류 없는 목록에는 필터 버튼이 없다", async () => {
  const { cleanup } = renderPage("page=1");
  try {
    await screen.findByRole("heading", { name: "전체 상품" });
    expect(
      screen.queryByRole("button", { name: "필터" }),
    ).not.toBeInTheDocument();
  } finally {
    cleanup();
  }
});

it("시트를 연 채 lg 이상으로 넓어지면 시트를 닫는다", async () => {
  let handleChange: ((event: { matches: boolean }) => void) | undefined;
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: (_: string, listener: typeof handleChange) => {
      handleChange = listener;
    },
    removeEventListener: vi.fn(),
  });
  const user = userEvent.setup();
  const { cleanup } = renderPage("category=category-1");
  try {
    await user.click(await screen.findByRole("button", { name: "필터" }));
    expect(screen.getByRole("dialog", { name: "필터" })).toBeVisible();
    act(() => handleChange?.({ matches: true }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  } finally {
    cleanup();
  }
});
