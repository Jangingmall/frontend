import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mapProductCrafts } from "@/api/products/mapper";
import {
  productCategories,
  productCrafts,
  productMaterials,
} from "@/api/products/mock/catalogue";

import { ProductFilterPanel } from "./ProductFilterPanel";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

const props = {
  category: productCategories[1],
  categories: productCategories,
  crafts: mapProductCrafts(productCrafts),
  materials: productMaterials,
  query: { category: "kitchen-1", crafts: [], materials: [] },
  onChange: vi.fn(),
};

describe("ProductFilterPanel", () => {
  it("onReset이 있을 때만 상단 초기화 헤더를 그린다", () => {
    const { rerender } = render(
      <ProductFilterPanel {...props} onReset={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "초기화" })).toBeVisible();
    rerender(<ProductFilterPanel {...props} />);
    expect(
      screen.queryByRole("button", { name: "초기화" }),
    ).not.toBeInTheDocument();
  });

  it("defaultOpen으로 처음 펼칠 항목을 지정한다", () => {
    render(<ProductFilterPanel {...props} defaultOpen={[]} />);
    expect(screen.getByRole("button", { name: "가격대" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "소재" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("기본은 사이드바 규칙(분류·가격·소재 펼침)을 따른다", () => {
    render(<ProductFilterPanel {...props} />);
    expect(screen.getByRole("button", { name: "가격대" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
