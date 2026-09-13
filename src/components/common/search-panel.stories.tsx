import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchPanel } from "./search-panel";

const meta = {
  title: "Common/SearchPanel",
  component: SearchPanel,
  parameters: { layout: "fullscreen" },
  args: { onClose: () => {} },
} satisfies Meta<typeof SearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 열림 상태를 고정 렌더 — 입력·지우기·제출 인터랙션도 실제로 확인 가능. */
export const Default: Story = {};
