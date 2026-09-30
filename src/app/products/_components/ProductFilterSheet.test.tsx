import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { mapProductCrafts } from "@/api/products/mapper";
import {
  productCategories,
  productCrafts,
  productMaterials,
} from "@/api/products/mock/catalogue";
import type { ProductListQuery } from "@/api/products/query";

import { ProductFilterSheet } from "./ProductFilterSheet";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

const baseProps = {
  category: productCategories[1],
  categories: productCategories,
  crafts: mapProductCrafts(productCrafts),
  materials: productMaterials,
};
const initialQuery: ProductListQuery = {
  category: "kitchen-1",
  crafts: ["1"],
  materials: ["wood"],
  minPrice: 5000,
};

function Harness({
  onApply = vi.fn(),
  query = initialQuery,
}: {
  onApply?: (patch: Partial<ProductListQuery>) => void;
  query?: ProductListQuery;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>필터 열기</button>
      <ProductFilterSheet
        {...baseProps}
        query={query}
        open={open}
        onOpenChange={setOpen}
        onApply={(patch) => {
          onApply(patch);
          setOpen(false);
        }}
      />
    </>
  );
}

async function openSheet() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "필터 열기" }));
  return { user, sheet: await screen.findByRole("dialog", { name: "필터" }) };
}

describe("ProductFilterSheet", () => {
  it("열 때 현재 필터를 초안으로 보여주고 아코디언은 접힌 채 시작한다(선택된 종목만 펼침)", async () => {
    render(<Harness />);
    const { sheet } = await openSheet();
    expect(
      within(sheet).getByRole("button", { name: "사기장" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(sheet).getByRole("button", { name: "가격대" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(within(sheet).getByRole("button", { name: "소재" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("확인은 초안 전체를 한 번의 변경으로 넘긴다", async () => {
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    const { user, sheet } = await openSheet();
    await user.click(within(sheet).getByRole("button", { name: "유기장" }));
    await user.click(within(sheet).getByRole("button", { name: "소재" }));
    await user.click(within(sheet).getByRole("button", { name: "도자기" }));
    await user.click(within(sheet).getByRole("button", { name: "확인" }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      category: "kitchen-1",
      crafts: ["1", "2"],
      materials: ["wood", "ceramic"],
      minPrice: 5000,
      maxPrice: undefined,
      hasGiftWrap: false,
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("초기화는 초안만 비우고 분류는 유지하며 확인 전에는 아무것도 반영하지 않는다", async () => {
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    const { user, sheet } = await openSheet();
    await user.click(within(sheet).getByRole("button", { name: "초기화" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(
      within(sheet).getByRole("button", { name: "사기장" }),
    ).toHaveAttribute("aria-pressed", "false");
    await user.click(within(sheet).getByRole("button", { name: "확인" }));
    expect(onApply).toHaveBeenCalledWith({
      category: "kitchen-1",
      crafts: [],
      materials: [],
      minPrice: undefined,
      maxPrice: undefined,
      hasGiftWrap: false,
    });
  });

  it("닫기·ESC는 초안을 버리고 다시 열면 현재 필터로 돌아간다", async () => {
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    let { user, sheet } = await openSheet();
    await user.click(within(sheet).getByRole("button", { name: "유기장" }));
    await user.click(within(sheet).getByRole("button", { name: "닫기" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    ({ user, sheet } = await openSheet());
    expect(
      within(sheet).getByRole("button", { name: "유기장" }),
    ).toHaveAttribute("aria-pressed", "false");
    await user.click(within(sheet).getByRole("button", { name: "유기장" }));
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(onApply).not.toHaveBeenCalled();
  });

  it("PL-2에서 시트 안 소분류를 고르면 초안의 분류가 바뀌고 소재·가격은 비워진다", async () => {
    const onApply = vi.fn();
    render(
      <Harness
        onApply={onApply}
        query={{
          category: "kitchen",
          materials: ["wood"],
          minPrice: 5000,
          maxPrice: 90000,
        }}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "필터 열기" }));
    const sheet = await screen.findByRole("dialog", { name: "필터" });
    await user.click(within(sheet).getByRole("button", { name: /키친/ }));
    await user.click(
      within(sheet).getByRole("button", { name: "다기 · 찻잔" }),
    );
    await user.click(within(sheet).getByRole("button", { name: "확인" }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "kitchen-1",
        materials: [],
        minPrice: undefined,
        maxPrice: undefined,
      }),
    );
  });

  it("분류를 바꾸면 이전에 남아 있던 종목이 확인 때 되살아나지 않는다", async () => {
    const onApply = vi.fn();
    render(
      <Harness
        onApply={onApply}
        query={{ category: "kitchen", crafts: ["1"], materials: ["wood"] }}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "필터 열기" }));
    const sheet = await screen.findByRole("dialog", { name: "필터" });
    await user.click(within(sheet).getByRole("button", { name: /키친/ }));
    await user.click(
      within(sheet).getByRole("button", { name: "다기 · 찻잔" }),
    );
    await user.click(within(sheet).getByRole("button", { name: "확인" }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ category: "kitchen-1", crafts: [] }),
    );
  });
});
