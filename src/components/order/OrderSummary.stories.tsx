import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OrderSummary } from "./OrderSummary";
const meta = {
  title: "Order/OrderSummary",
  component: OrderSummary,
  args: { productAmount: 100000, shippingAmount: 3000, totalAmount: 103000 },
  decorators: [
    (Story) => (
      <div className="w-79.5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Cart: Story = {};
export const Checkout: Story = { args: { totalLabel: "총 결제금액" } };
