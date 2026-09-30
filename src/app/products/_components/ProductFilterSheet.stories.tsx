import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { mapProductCrafts } from "@/api/products/mapper";
import {
  productCategories,
  productCrafts,
  productMaterials,
} from "@/api/products/mock/catalogue";
import type { ProductListQuery } from "@/api/products/query";

import { ProductFilterSheet } from "./ProductFilterSheet";

/** 시트 안 조작은 초안이다 — [확인]에서만 `onApply`가 불리고 시트가 닫힌다. */
function Demo({ query }: { query: ProductListQuery }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        필터 열기
      </button>
      <ProductFilterSheet
        query={query}
        category={
          productCategories.find((item) => item.id === query.category) ??
          productCategories[1]
        }
        categories={productCategories}
        crafts={mapProductCrafts(productCrafts)}
        materials={productMaterials}
        open={open}
        onOpenChange={setOpen}
        onApply={() => setOpen(false)}
      />
    </>
  );
}

const meta = {
  title: "Products/ProductFilterSheet",
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  args: { query: { category: "kitchen-1", crafts: ["1"] } },
  render: (args) => <Demo query={args.query} />,
} satisfies Meta<{ query: ProductListQuery }>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 375: 항목이 세로로 쌓이고 종목·소재 칩은 2열 36px. */
export const Mobile: Story = {};

/** 768: 항목 헤더 3개가 한 줄, 펼친 패널이 아래 전폭. */
export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: "tablet" } },
};

/** PL-2(대분류): 첫 항목이 하위 분류 목록. */
export const Category: Story = {
  args: { query: { category: "kitchen" } },
};
