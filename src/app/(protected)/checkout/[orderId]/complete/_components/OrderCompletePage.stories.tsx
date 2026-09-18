import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OrderCompletePage } from "./OrderCompletePage";

const meta = {
  title: "Checkout/OrderCompletePage",
  component: OrderCompletePage,
  parameters: { layout: "fullscreen" },
  args: {
    onViewOrders: () => undefined,
    onContinueBrowsing: () => undefined,
  },
} satisfies Meta<typeof OrderCompletePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = { args: { outcome: "success" } };

export const BankPending: Story = {
  args: { outcome: "bank-pending", totalAmount: 999_999_999 },
};
