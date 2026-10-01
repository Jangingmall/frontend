import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DiscountSlots } from "./DiscountSlots";

const meta = {
  title: "Pages/Checkout/DiscountSlots",
  component: DiscountSlots,
  decorators: [
    (Story) => (
      <div className="w-full max-w-[545px]">
        <Story />
      </div>
    ),
  ],
  args: { mode: "unavailable" },
} satisfies Meta<typeof DiscountSlots>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
