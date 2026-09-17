import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductToolbar } from "./ProductToolbar";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it("운영 기본 정렬은 최신순이며 포장 조건을 적용하지 않는다", () => {
  expect(
    parseProductSearchParams(
      new URLSearchParams("sort=popular&hasGiftWrap=true"),
    ),
  ).toMatchObject({ sort: "newest", hasGiftWrap: false });
  render(<ProductToolbar sort="newest" onSortChange={vi.fn()} />);
  expect(screen.getByRole("combobox")).toHaveTextContent("최신순");
});
