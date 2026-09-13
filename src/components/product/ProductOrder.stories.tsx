import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mapProductSummary } from "@/api/products/mapper";
import { productCatalogue } from "@/api/products/mock/catalogue";

import { ProductOrder } from "./ProductOrder";

const thumbnail = mapProductSummary(productCatalogue[0]).thumbnail;

const meta = {
  title: "Product/ProductOrder",
  component: ProductOrder,
  decorators: [
    (Story) => (
      <div className="w-130">
        <Story />
      </div>
    ),
  ],
  args: {
    thumbnail,
    productName: "백자 달항아리",
    options: ["색상: 백자토", "사이즈: 중"],
    quantity: 1,
    price: 320000,
  },
} satisfies Meta<typeof ProductOrder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNote: Story = {
  args: {
    note: "주문제작 작품 포함 · 약 6주 후 전체 작품이 함께 배송됩니다.",
  },
};

export const NoOptions: Story = {
  args: { options: undefined },
};

export const LongName: Story = {
  args: {
    productName: "장인의 정성과 전통을 담아 정성스럽게 빚은 백자 달항아리",
    options: ["색상: 백자토 · 표면 유약 마감", "사이즈: 특대"],
  },
};
