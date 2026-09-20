import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OrderClaimProductSummary } from "./OrderClaimProductSummary";

const meta = {
  title: "Order/OrderClaimProductSummary",
  component: OrderClaimProductSummary,
  parameters: { layout: "padded" },
  args: {
    item: {
      productName: "백자 달항아리",
      price: 320000,
      quantity: 1,
      thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
      options: ["색상: 백자색", "사이즈: 중"],
    },
    purchasedAt: "2026-09-05T00:00:00.000Z",
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderClaimProductSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Detailed: Story = {};

export const WithoutOptions: Story = {
  args: {
    item: {
      productName: "백자 달항아리",
      price: 320000,
      quantity: 1,
      thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
    },
  },
};
