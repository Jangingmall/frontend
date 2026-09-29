import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { gnbCategoriesFixture } from "@/api/products/mock/gnb-categories";

import { CategoryMegaPanel } from "./category-mega-panel";

const meta = {
  title: "Common/CategoryMegaPanel",
  component: CategoryMegaPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-100 bg-fill-neutral-weak">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CategoryMegaPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 열림 상태를 고정 렌더 — 탭 hover로 실제 전환 동작도 확인 가능. */
export const Default: Story = {
  args: {
    categories: gnbCategoriesFixture,
    activeCategoryId: gnbCategoriesFixture[0].id,
    onActiveCategoryChange: () => {},
  },
  render: (args) => {
    function CategoryMegaPanelDemo() {
      const [activeCategoryId, setActiveCategoryId] = useState(
        args.activeCategoryId,
      );
      return (
        <CategoryMegaPanel
          categories={args.categories}
          activeCategoryId={activeCategoryId}
          onActiveCategoryChange={setActiveCategoryId}
        />
      );
    }
    return <CategoryMegaPanelDemo />;
  },
};

/** 소분류가 12개(가장 많음)라 3열을 다 채우는 케이스. */
export const ManySubcategories: Story = {
  args: {
    categories: gnbCategoriesFixture,
    activeCategoryId: gnbCategoriesFixture[2].id,
    onActiveCategoryChange: () => {},
  },
};

export const Loading: Story = {
  args: {
    categories: [],
    status: "loading",
    activeCategoryId: "",
    onActiveCategoryChange: () => {},
  },
};

export const LoadError: Story = {
  args: {
    categories: [],
    status: "error",
    onRetry: () => {},
    activeCategoryId: "",
    onActiveCategoryChange: () => {},
  },
};
