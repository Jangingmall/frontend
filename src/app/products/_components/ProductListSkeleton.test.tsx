import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Loading from "@/app/products/loading";

import { ProductListSkeleton } from "./ProductListSkeleton";

const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => params.value }));

describe("ProductListSkeleton", () => {
  it("카테고리 목록은 lg 이상에서 필터 자리를 함께 그린다", () => {
    render(<ProductListSkeleton isCategoryList />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByTestId("filter-placeholder")).toBeInTheDocument();
  });

  it("분류 없는 목록은 필터 자리를 그리지 않는다", () => {
    render(<ProductListSkeleton isCategoryList={false} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByTestId("filter-placeholder")).not.toBeInTheDocument();
  });
});

describe("라우트 loading", () => {
  it("category 쿼리가 있으면 카테고리 목록 스켈레톤을 쓴다", () => {
    params.value = new URLSearchParams("category=category-1");
    render(<Loading />);
    expect(screen.getByTestId("filter-placeholder")).toBeInTheDocument();
  });

  it("category 쿼리가 없으면 분류 없는 목록 스켈레톤을 쓴다", () => {
    params.value = new URLSearchParams("page=2");
    render(<Loading />);
    expect(screen.queryByTestId("filter-placeholder")).not.toBeInTheDocument();
  });
});
