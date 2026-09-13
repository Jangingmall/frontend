import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SectionHeader } from "./SectionHeader";

const meta = {
  title: "Home/SectionHeader",
  component: SectionHeader,
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "베스트",
    description: "최근 4주 판매·조회 기준",
    viewAll: { href: { pathname: "/products", query: { preset: "best" } } },
  },
};

export const Disabled: Story = {
  args: {
    title: "장인관",
    description: "한 사람의 작업을 처음부터 끝까지 들여다봅니다",
    viewAll: { disabled: true },
  },
};
