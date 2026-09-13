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

/** TOP은 클릭 가능, AI CHAT은 아직 기능이 없어 비활성 상태다. */
export const Default: Story = {};
