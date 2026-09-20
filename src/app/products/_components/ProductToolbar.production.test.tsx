import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductToolbar } from "./ProductToolbar";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it("운영 기본 정렬은 최신순이며 포장 UI 선택을 보존한다", () => {
  expect(
    parseProductSearchParams(
      new URLSearchParams("sort=popular&hasGiftWrap=true"),
    ),
  ).toMatchObject({ sort: "newest", hasGiftWrap: true });
  render(<ProductToolbar sort="newest" onSortChange={vi.fn()} />);
  expect(screen.getByRole("combobox")).toHaveTextContent("최신순");
});

it("운영에서도 정렬 6개를 표시하고 준비 중인 정렬만 비활성화한다", async () => {
  const user = userEvent.setup();
  const onSortChange = vi.fn();
  render(<ProductToolbar sort="newest" onSortChange={onSortChange} />);
  await user.click(screen.getByRole("combobox"));
  expect(screen.getAllByRole("option")).toHaveLength(6);
  for (const name of ["인기순", "판매량순", "찜 많은 순"]) {
    const option = screen.getByRole("option", { name });
    expect(option).toHaveAttribute("aria-disabled", "true");
    expect(option).toHaveAttribute("title", "준비 중인 정렬입니다");
    await user.click(option);
    expect(onSortChange).not.toHaveBeenCalled();
  }
  await user.click(screen.getByRole("option", { name: "높은 가격순" }));
  expect(onSortChange).toHaveBeenCalledWith("price-desc");
});
