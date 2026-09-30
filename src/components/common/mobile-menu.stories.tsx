import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { gnbCategoriesFixture } from "@/api/products/mock/gnb-categories";

import {
  MobileMenu,
  type MobileMenuProps,
  type MobileMenuView,
} from "./mobile-menu";

/** 열림 상태를 고정 렌더한다. 화면 전환(전체 메뉴 ↔ 대분류)은 실제로 동작한다. */
function Demo(args: MobileMenuProps) {
  const [view, setView] = useState<MobileMenuView>(args.view);
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        메뉴 열기
      </button>
      <MobileMenu
        {...args}
        open={open}
        onOpenChange={setOpen}
        view={view}
        onViewChange={setView}
      />
    </>
  );
}

const meta = {
  title: "Common/MobileMenu",
  component: MobileMenu,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    open: true,
    onOpenChange: () => {},
    view: "root",
    onViewChange: () => {},
    categories: gnbCategoriesFixture,
  },
  render: (args) => <Demo {...args} />,
} satisfies Meta<typeof MobileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Root: Story = {};

export const Authenticated: Story = {
  args: { authStatus: "authenticated" },
};

export const AuthLoading: Story = {
  args: { authStatus: "loading" },
};

export const Categories: Story = {
  args: { view: "category" },
};

export const CategoriesLoading: Story = {
  args: { view: "category", categories: [], categoriesStatus: "loading" },
};

export const CategoriesError: Story = {
  args: {
    view: "category",
    categories: [],
    categoriesStatus: "error",
    onCategoriesRetry: () => {},
  },
};
