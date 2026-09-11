import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";

import { EmptyState } from "./empty-state";

const meta = {
  title: "Common/EmptyState",
  component: EmptyState,
  parameters: { layout: "padded" },
  args: {
    title: "찜한 상품이 없어요",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithDescription: Story = {
  args: {
    description: "마음에 드는 상품을 찜해 보세요.",
  },
};

export const WithAction: Story = {
  args: {
    description: "마음에 드는 상품을 찜해 보세요.",
    action: (
      <Button variant="outline" size="s">
        쇼핑 계속하기
      </Button>
    ),
  },
};
