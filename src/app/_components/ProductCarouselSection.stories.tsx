import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mapProductListPage } from "@/api/products/mapper";
import { productCatalogue } from "@/api/products/mock/catalogue";

import { ProductCarouselSection } from "./ProductCarouselSection";

const bestData = mapProductListPage(
  { items: productCatalogue.slice(0, 5), totalCount: 5 },
  { page: 1, size: 5 },
);
const newData = mapProductListPage(
  { items: productCatalogue.slice(0, 4), totalCount: 4 },
  { page: 1, size: 4 },
);

const meta = {
  title: "Home/ProductCarouselSection",
  component: ProductCarouselSection,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProductCarouselSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Best: Story = {
  args: {
    title: "베스트",
    description: "최근 4주 판매·조회 기준",
    viewAllPreset: "best",
    columns: 5,
    data: bestData,
  },
};

export const New: Story = {
  args: {
    title: "신상품",
    description: "새롭게 만나는 장인과 작품의 이야기",
    viewAllPreset: "new",
    columns: 4,
    data: newData,
  },
};

/** 조회 실패·결과 없음일 때 — 섹션 자체를 렌더링하지 않는다. */
export const Empty: Story = {
  args: {
    title: "신상품",
    description: "새롭게 만나는 장인과 작품의 이야기",
    viewAllPreset: "new",
    columns: 4,
    data: undefined,
  },
};
