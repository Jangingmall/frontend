import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HOME_PROMOTION_PRODUCTS } from "@/api/home/mock/fixtures";

import { PromotionSection } from "./PromotionSection";

const meta = {
  title: "Home/PromotionSection",
  component: PromotionSection,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PromotionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 프론트 MSW 상품 데이터 · 카드·전체보기 클릭 비활성(IA 명시). */
export const Default: Story = {
  args: { items: HOME_PROMOTION_PRODUCTS },
};
