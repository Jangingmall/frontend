import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { expect, it, vi } from "vitest";

import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { productKeys } from "@/queries/products/keys";

import { GiftSection } from "./GiftSection";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));

it("홈 선물은 실제 API와 일반 상품 목록의 빈 캐시를 사용하지 않는다", async () => {
  const realApi = vi.fn(() => mockError(500, "INTERNAL_ERROR"));
  server.use(http.get("*/api/products", realApi));
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const key = productKeys.list({ giftTheme: "housewarming", size: 3 });
  const empty = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 3,
    totalPages: 0,
  };
  client.setQueryData(key, empty);
  render(
    <QueryClientProvider client={client}>
      <GiftSection initialTheme="housewarming" />
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(screen.getAllByRole("button", { name: /찜하기/ })).toHaveLength(3),
  );
  expect(realApi).not.toHaveBeenCalled();
  expect(client.getQueryData(key)).toEqual(empty);
  const productLinks = screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("href")?.includes("/products/"));
  expect(productLinks).toHaveLength(3);
  for (const link of productLinks)
    expect(link.getAttribute("href")).toContain("preview=1");
});
