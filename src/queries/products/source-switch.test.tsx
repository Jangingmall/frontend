import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { expect, it, vi } from "vitest";

import { useProductReviews } from "@/queries/reviews/queries";

import { useProductList } from "./queries";

const state = vi.hoisted(() => ({
  catalogue: vi.fn(),
  reviews: vi.fn(),
  demoReviews: vi.fn(),
}));
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
vi.mock("@/api/products/catalogue-client", () => ({
  fetchProductCatalogueClient: state.catalogue,
}));
vi.mock("@/api/reviews/api", () => ({ fetchReviews: state.reviews }));
vi.mock("@/api/reviews/demo-api", () => ({
  fetchDemoReviews: state.demoReviews,
}));
function Wrapper({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

it("does not show previous demo products as actual products while loading", async () => {
  state.catalogue
    .mockResolvedValueOnce({
      items: [{ id: 101, isDemo: true }],
      totalCount: 1,
    })
    .mockImplementation(() => new Promise(() => {}));
  const { result, rerender } = renderHook(
    ({ sort }: { sort: "sales" | "newest" }) => useProductList({ sort }, true),
    { initialProps: { sort: "sales" }, wrapper: Wrapper },
  );
  await waitFor(() => expect(result.current.data?.totalCount).toBe(1));
  rerender({ sort: "newest" });
  expect(result.current.data).toBeUndefined();
});
it("does not show previous demo photo reviews as actual reviews while loading", async () => {
  state.demoReviews.mockResolvedValue({ items: [{ id: 1 }], totalCount: 1 });
  state.reviews.mockImplementation(() => new Promise(() => {}));
  const { result, rerender } = renderHook(
    ({ photoOnly }) =>
      useProductReviews(101, { page: 1, sort: "latest", photoOnly }, false),
    { initialProps: { photoOnly: true }, wrapper: Wrapper },
  );
  await waitFor(() => expect(result.current.data?.totalCount).toBe(1));
  rerender({ photoOnly: false });
  expect(result.current.data).toBeUndefined();
});
