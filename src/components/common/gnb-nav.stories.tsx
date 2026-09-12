import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef } from "react";

import { GnbNav } from "./gnb-nav";

const meta = {
  title: "Common/GnbNav",
  component: GnbNav,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GnbNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `GnbNav`는 이제 트리거 렌더 + 이벤트 위임만 한다 — 호버로 열리는 실제 패널은
 * `Gnb.stories.tsx`에서 확인한다. 여기선 정적 상태(닫힘/열림 강조)만 보여준다.
 */
export const Default: Story = {
  args: {
    isCategoryPanelOpen: false,
    categoryTriggerRef: { current: null },
    onCategoryTriggerMouseEnter: () => {},
    onCategoryTriggerFocus: () => {},
  },
  render: (args) => {
    function GnbNavDemo() {
      const categoryTriggerRef = useRef<HTMLAnchorElement>(null);
      return <GnbNav {...args} categoryTriggerRef={categoryTriggerRef} />;
    }
    return <GnbNavDemo />;
  },
};

export const CategoryPanelOpen: Story = {
  args: {
    isCategoryPanelOpen: true,
    categoryTriggerRef: { current: null },
    onCategoryTriggerMouseEnter: () => {},
    onCategoryTriggerFocus: () => {},
  },
  render: (args) => {
    function GnbNavDemo() {
      const categoryTriggerRef = useRef<HTMLAnchorElement>(null);
      return <GnbNav {...args} categoryTriggerRef={categoryTriggerRef} />;
    }
    return <GnbNavDemo />;
  },
};
