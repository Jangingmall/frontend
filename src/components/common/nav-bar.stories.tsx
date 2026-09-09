import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NavBar } from "./nav-bar";

const meta = {
  title: "Common/NavBar",
  component: NavBar,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 1차 카테고리 행만 (메가메뉴 행 없음) */
export const PrimaryOnly: Story = {
  args: { rows: "primary" },
};
