import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { GnbNav } from "./gnb-nav";

const meta = {
  title: "Common/GnbNav",
  component: GnbNav,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GnbNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/** controlled 컴포넌트라 스토리에서도 실제 열림 상태를 들고 있어야 호버가 동작한다. */
export const Default: Story = {
  args: {
    isCategoryPanelOpen: false,
    onCategoryPanelOpenChange: () => {},
  },
  render: (args) => {
    function GnbNavDemo() {
      const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(
        args.isCategoryPanelOpen,
      );
      return (
        <GnbNav
          isCategoryPanelOpen={isCategoryPanelOpen}
          onCategoryPanelOpenChange={setIsCategoryPanelOpen}
        />
      );
    }
    return <GnbNavDemo />;
  },
};
