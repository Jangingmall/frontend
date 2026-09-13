import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Header } from "./header";

const meta = {
  title: "Common/Header",
  component: Header,
  parameters: { layout: "fullscreen" },
  args: { cartCount: 0 },
  argTypes: {
    authStatus: {
      control: "inline-radio",
      options: ["loading", "anonymous", "authenticated"],
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { authStatus: "loading" },
};

export const Authenticated: Story = {
  args: { authStatus: "authenticated" },
};

export const WithCartCount: Story = {
  args: { cartCount: 99 },
};

/** 검색 아이콘 클릭으로 `isSearchPanelOpen`(aria-expanded)이 토글되는 걸 확인 — 실제 검색
 * 패널 렌더는 `Gnb.stories.tsx`에서 확인한다(자리를 공유하는 카테고리 패널과 마찬가지). */
export const SearchToggle: Story = {
  render: (args) => {
    function HeaderDemo() {
      const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
      return (
        <Header
          {...args}
          isSearchPanelOpen={isSearchPanelOpen}
          onSearchTriggerClick={() => setIsSearchPanelOpen((prev) => !prev)}
        />
      );
    }
    return <HeaderDemo />;
  },
};
