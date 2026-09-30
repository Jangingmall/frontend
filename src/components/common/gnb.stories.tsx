import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { gnbCategoriesFixture } from "@/api/products/mock/gnb-categories";

import { Gnb } from "./gnb";

const meta = {
  title: "Common/Gnb",
  component: Gnb,
  parameters: { layout: "fullscreen" },
  argTypes: {
    authStatus: {
      control: "inline-radio",
      options: ["loading", "anonymous", "authenticated"],
    },
  },
  args: { categories: gnbCategoriesFixture },
} satisfies Meta<typeof Gnb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { authStatus: "loading" },
};

export const Authenticated: Story = {
  args: { authStatus: "authenticated" },
};

/** 분류 조회 중 — 전체 카테고리에 마우스를 올리면 스켈레톤이 보인다. */
export const CategoriesLoading: Story = {
  args: { categories: [], categoriesStatus: "loading" },
};

/** 분류 조회 실패 — 전체 카테고리 패널에 오류와 다시 시도가 보인다. */
export const CategoriesError: Story = {
  args: {
    categories: [],
    categoriesStatus: "error",
    onCategoriesRetry: () => {},
  },
};
