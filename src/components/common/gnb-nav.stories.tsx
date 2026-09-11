import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GnbNav } from "./gnb-nav";

const meta = {
  title: "Common/GnbNav",
  component: GnbNav,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GnbNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
