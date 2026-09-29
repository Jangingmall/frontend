import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FloatingActions } from "./floating-actions";

const meta = {
  title: "Common/FloatingActions",
  component: FloatingActions,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-100 bg-fill-neutral-weak">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FloatingActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `onAiChatToggle`이 없어 미담 챗봇 버튼이 비인터랙티브 상태로 보인다. */
export const Default: Story = {};

/** `onAiChatToggle`을 주면 미담 챗봇 버튼이 실제로 클릭 가능해진다. */
export const Interactive: Story = {
  args: { onAiChatToggle: () => {} },
};

/** 챗봇 패널이 열려 있을 때 — 접기 버튼 하나만 보인다. */
export const ChatOpen: Story = {
  args: { isChatOpen: true, onAiChatToggle: () => {} },
};

export const ProductDetail: Story = { args: { showAiChat: false } };
