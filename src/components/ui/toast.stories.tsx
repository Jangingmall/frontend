import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toast } from "./toast";

const meta = {
  title: "UI/Toast",
  component: Toast,
  parameters: { layout: "padded" },
  args: { children: "토스트 알림입니다." },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAction: Story = {
  args: { actionLabel: "장바구니에 다시 추가" },
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <Toast {...args} />
      <Toast {...args} actionLabel="장바구니에 다시 추가" />
    </div>
  ),
};
