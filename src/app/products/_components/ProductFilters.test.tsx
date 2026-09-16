import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mapProductCrafts } from "@/api/products/mapper";
import {
  productCategories,
  productCrafts,
  productMaterials,
} from "@/api/products/mock/catalogue";

import { ProductFilters } from "./ProductFilters";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

const props = {
  category: productCategories[1],
  categories: productCategories,
  crafts: mapProductCrafts(productCrafts),
  materials: productMaterials,
  query: { category: "kitchen-1", crafts: ["1"], materials: ["wood"] },
  onChange: vi.fn(),
  onReset: vi.fn(),
};

describe("PL-3 종목 필터", () => {
  it("URL 선택을 표시하고 다른 종목을 추가·해제해도 소재를 건드리지 않는다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <ProductFilters {...props} onChange={onChange} />,
    );
    expect(screen.getByRole("button", { name: "다기 · 찻잔" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: "사기장" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "유기장" }));
    expect(onChange).toHaveBeenLastCalledWith({ crafts: ["1", "2"] });
    rerender(
      <ProductFilters
        {...props}
        query={{ ...props.query, crafts: ["1", "2"] }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "사기장" }));
    expect(onChange).toHaveBeenLastCalledWith({ crafts: ["2"] });
    await user.click(screen.getByRole("button", { name: "초기화" }));
    expect(props.onReset).toHaveBeenCalledOnce();
  });

  it("키보드로 종목을 선택한다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ProductFilters {...props} onChange={onChange} />);
    screen.getByRole("button", { name: "유기장" }).focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith({ crafts: ["1", "2"] });
  });

  it("PL-2에서는 기존 하위 분류 탐색을 제공한다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ProductFilters
        {...props}
        category={productCategories[0]}
        query={{ category: "kitchen" }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "키친 · 다이닝" }));
    await user.click(screen.getByRole("button", { name: "다기 · 찻잔" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: "kitchen-1" }),
    );
    expect(
      screen.queryByRole("button", { name: "사기장" }),
    ).not.toBeInTheDocument();
  });

  it("종목 조회 중·실패·빈 목록을 구분하고 실패를 재시도한다", async () => {
    const user = userEvent.setup();
    const onRetryCrafts = vi.fn();
    const { rerender } = render(
      <ProductFilters {...props} crafts={[]} isCraftsPending />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("종목을 불러오는 중");
    rerender(
      <ProductFilters
        {...props}
        crafts={[]}
        hasCraftsError
        onRetryCrafts={onRetryCrafts}
      />,
    );
    expect(screen.getByText("종목을 불러오지 못했어요")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetryCrafts).toHaveBeenCalledOnce();
    rerender(<ProductFilters {...props} crafts={[]} />);
    expect(screen.getByText("선택할 수 있는 종목이 없어요.")).toBeVisible();
  });
});
