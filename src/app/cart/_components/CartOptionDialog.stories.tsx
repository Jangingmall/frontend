import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { getCartOptions } from "@/app/cart/_lib/cart-fixtures";

import { CartOptionDialog } from "./CartOptionDialog";
const meta = {
  title: "Pages/Cart/Options",
  component: CartOptionDialog,
  args: {
    open: true,
    definitions: getCartOptions(1),
    initialValues: [],
    onApply: fn(),
    onOpenChange: fn(),
  },
} satisfies Meta<typeof CartOptionDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selecting: Story = {
  args: { initialValues: ["백자토"], initialOpenIndex: 1 },
};
export const Selected: Story = {
  args: { initialValues: ["백자토", "중", "무광", "선택 안 함"] },
};
export const Warning: Story = { args: { initialError: true } };
export const WithoutGift: Story = {
  args: { definitions: getCartOptions(1).filter((option) => !option.gift) },
};
