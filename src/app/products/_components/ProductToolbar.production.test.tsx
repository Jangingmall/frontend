import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { toProductListSearchParams } from "@/api/products/query";
import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductToolbar } from "./ProductToolbar";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it.each(["popular", "sales", "wishlist"] as const)(
  "미지원 정렬 %s는 최신순으로 정규화한다",
  (sort) => {
    expect(parseProductSearchParams(new URLSearchParams({ sort })).sort).toBe(
      "newest",
    );
    expect(toProductListSearchParams({ sort }).getAll("sort")).toEqual([
      "NEWEST",
    ]);
  },
);
it("운영 기본 정렬은 최신순이며 미지원 포장 선택을 무시한다", () => {
  expect(
    parseProductSearchParams(
      new URLSearchParams("sort=popular&hasGiftWrap=true"),
    ),
  ).toMatchObject({ sort: "newest", hasGiftWrap: false });
  render(<ProductToolbar sort="newest" onSortChange={vi.fn()} />);
  expect(screen.getByRole("combobox")).toHaveTextContent("최신순");
});

it("API 모드에서는 지원되는 정렬만 선택한다", async () => {
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  render(<ProductToolbar sort="newest" onSortChange={onSortChange} />);
  await user.click(screen.getByRole("combobox"));
  expect(screen.getAllByRole("option")).toHaveLength(3);
  for (const name of ["인기순", "판매량순", "찜 많은 순"]) {
    expect(screen.queryByRole("option", { name })).not.toBeInTheDocument();
  }
  await user.click(screen.getByRole("option", { name: "높은 가격순" }));
  expect(onSortChange).toHaveBeenCalledWith("price-desc");
});

it("베스트 preset 직접 URL에서도 실제 최신 목록과 전체 상품 제목을 사용한다", () => {
  const query = parseProductSearchParams(new URLSearchParams("preset=best"));
  expect(query.sort).toBe("newest");
  render(<ProductToolbar sort={query.sort!} onSortChange={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "전체 상품" })).toBeVisible();
  expect(screen.queryByText("베스트")).not.toBeInTheDocument();
});
