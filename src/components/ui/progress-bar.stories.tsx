import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressBar } from "./progress-bar";

const meta = {
  title: "UI/ProgressBar",
  component: ProgressBar,
  parameters: { layout: "padded" },
  args: { state: "good", label: "label-1", labelEnd: "label-2" },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["default", "alert", "caution", "good", "perfect"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-60">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(["default", "alert", "caution", "good", "perfect"] as const).map(
        (s) => (
          <ProgressBar
            key={s}
            {...args}
            state={s}
            label={s}
            labelEnd={`${s}`}
          />
        ),
      )}
    </div>
  ),
};
