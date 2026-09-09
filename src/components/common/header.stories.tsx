import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Header } from "./header";

const meta = {
  title: "Common/Header",
  component: Header,
  parameters: { layout: "fullscreen" },
  args: { cartCount: 0 },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCartCount: Story = {
  args: { cartCount: 99 },
};
