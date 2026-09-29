import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "./logo";

const meta = {
  title: "UI/Logo",
  component: Logo,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnLight: Story = {
  render: () => <Logo className="h-8 w-auto text-font-dark" />,
};

export const OnDark: Story = {
  render: () => (
    <div className="bg-fill-neutral-impact p-6">
      <Logo className="h-8 w-auto text-font-white" />
    </div>
  ),
};
