import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { toProductListSearchParams } from "@/api/products/query";
import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductToolbar } from "./ProductToolbar";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it.each(["sales", "wishlist"] as const)(
  "미지원 정렬 %s는 화면 URL에 보존하되 실제 API 형식은 바꾸지 않는다",
  (sort) => {
    expect(parseProductSearchParams(new URLSearchParams({ sort })).sort).toBe(
      sort,
    );
    expect(toProductListSearchParams({ sort }).getAll("sort")).toEqual([
      "NEWEST",
    ]);
  },
);
it("운영 기본 정렬은 최신순이며 시연 포장 선택을 보존한다", () => {
  expect(
    parseProductSearchParams(new URLSearchParams("hasGiftWrap=true")),
  ).toMatchObject({ sort: "newest", hasGiftWrap: true });
  render(<ProductToolbar sort="newest" onSortChange={vi.fn()} />);
  expect(screen.getByRole("combobox")).toHaveTextContent("최신순");
});

it("API 모드에서도 미지원 정렬을 시연으로 선택한다", async () => {
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  render(<ProductToolbar sort="newest" onSortChange={onSortChange} />);
  await user.click(screen.getByRole("combobox"));
  expect(await screen.findAllByRole("option")).toHaveLength(6);
  for (const name of ["판매량순", "찜 많은 순"]) {
    expect(screen.getByRole("option", { name })).toBeVisible();
  }
  await user.click(await screen.findByRole("option", { name: "높은 가격순" }));
  expect(onSortChange).toHaveBeenCalledWith("price-desc");
});

it("베스트 preset은 시연 판매량 정렬을 선택한다", () => {
  const query = parseProductSearchParams(new URLSearchParams("preset=best"));
  expect(query.sort).toBe("sales");
  render(<ProductToolbar sort={query.sort!} onSortChange={vi.fn()} />);
  expect(screen.getByRole("heading", { name: "전체 상품" })).toBeVisible();
  expect(screen.queryByText("베스트")).not.toBeInTheDocument();
});

it("인기순 선택과 직접 URL은 서버 POPULAR 정렬을 요청한다", async () => {
  expect(
    parseProductSearchParams(new URLSearchParams("sort=popular")).sort,
  ).toBe("popular");
  expect(toProductListSearchParams({ sort: "popular" }).get("sort")).toBe(
    "POPULAR",
  );
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  render(<ProductToolbar sort="newest" onSortChange={onSortChange} />);
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "인기순" }));
  expect(onSortChange).toHaveBeenCalledWith("popular");
});
