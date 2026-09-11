import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "./skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { className: "h-4 w-40" },
};

/** 화면별 로딩 레이아웃은 이렇게 여러 개를 조합해 만든다(예시: 카드형 목록 항목). */
export const CardComposition: Story = {
  render: () => (
    <div className="flex w-60 flex-col gap-3">
      <Skeleton className="aspect-square w-full rounded-none" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};
