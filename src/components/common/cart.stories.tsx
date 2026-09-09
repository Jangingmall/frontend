import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Cart } from "./cart";

const meta = {
  title: "Common/Cart",
  component: Cart,
  parameters: { layout: "centered" },
  args: { count: 3 },
  // 어두운 nav 위에서 쓰는 컴포넌트라 배경을 깔아 확인한다.
  decorators: [
    (Story) => (
      <div className="inline-flex bg-(--nav-bg) p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Cart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Cases: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Cart count={0} />
      <Cart count={3} />
      <Cart count={99} />
      <Cart count={128} />
    </div>
  ),
};
