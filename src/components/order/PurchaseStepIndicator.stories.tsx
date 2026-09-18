import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PurchaseStepIndicator } from "./PurchaseStepIndicator";
const meta = {
  title: "Order/PurchaseStepIndicator",
  component: PurchaseStepIndicator,
  args: { current: 1 },
} satisfies Meta<typeof PurchaseStepIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Cart: Story = {};
export const Checkout: Story = { args: { current: 2 } };
export const Complete: Story = { args: { current: 3 } };
