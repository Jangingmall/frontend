import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { GNB_CATEGORIES } from "@/constants/gnb-category";

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
    categories: GNB_CATEGORIES,
    activeCategoryName: GNB_CATEGORIES[0].name,
    onActiveCategoryChange: () => {},
  },
  render: (args) => {
    function CategoryMegaPanelDemo() {
      const [activeCategoryName, setActiveCategoryName] = useState(
        args.activeCategoryName,
      );
      return (
        <CategoryMegaPanel
          categories={args.categories}
          activeCategoryName={activeCategoryName}
          onActiveCategoryChange={setActiveCategoryName}
        />
      );
    }
    return <CategoryMegaPanelDemo />;
  },
};

/** 소분류가 12개(가장 많음)라 3열을 다 채우는 케이스. */
export const ManySubcategories: Story = {
  args: {
    categories: GNB_CATEGORIES,
    activeCategoryName: "패션 · 액세서리",
    onActiveCategoryChange: () => {},
  },
};
