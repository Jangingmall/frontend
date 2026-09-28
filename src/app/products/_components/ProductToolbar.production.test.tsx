import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { toProductListSearchParams } from "@/api/products/query";
import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductToolbar } from "./ProductToolbar";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it.each(["popular", "sales", "wishlist"] as const)(
  "미지원 정렬 %s는 URL과 시연 요청에 보존한다",
  (sort) => {
    expect(parseProductSearchParams(new URLSearchParams({ sort })).sort).toBe(
      sort,
    );
    expect(toProductListSearchParams({ sort }).getAll("sort")).toEqual([
      { popular: "POPULAR", sales: "SALES_COUNT", wishlist: "WISHLIST_COUNT" }[
        sort
      ],
    ]);
  },
);
it("운영 기본 정렬은 최신순이며 포장 UI 선택을 보존한다", () => {
  expect(
    parseProductSearchParams(
      new URLSearchParams("sort=popular&hasGiftWrap=true"),
    ),
  ).toMatchObject({ sort: "popular", hasGiftWrap: true });
  render(<ProductToolbar sort="newest" onSortChange={vi.fn()} />);
  expect(screen.getByRole("combobox")).toHaveTextContent("최신순");
});

it("API 모드에서도 시연 정렬을 선택할 수 있다", async () => {
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  render(<ProductToolbar sort="newest" onSortChange={onSortChange} />);
  await user.click(screen.getByRole("combobox"));
  expect(screen.getAllByRole("option")).toHaveLength(6);
  for (const name of ["인기순", "판매량순", "찜 많은 순"]) {
    expect(screen.getByRole("option", { name })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }
  await user.click(screen.getByRole("option", { name: "높은 가격순" }));
  expect(onSortChange).toHaveBeenCalledWith("price-desc");
});
