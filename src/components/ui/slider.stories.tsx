import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Slider } from "./slider";

const meta = {
  title: "UI/Slider",
  component: Slider,
  parameters: { layout: "padded" },
  args: { size: "m", min: 0, max: 100 },
  argTypes: { size: { control: "inline-radio", options: ["s", "m"] } },
  decorators: [
    (Story) => (
      <div className="w-90">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: { defaultValue: 40 },
};

export const Range: Story = {
  args: {
    defaultValue: [20, 80],
    minLabel: "0원",
    maxLabel: "100만 원+",
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-10">
      <Slider
        {...args}
        size="m"
        defaultValue={[20, 80]}
        minLabel="0원"
        maxLabel="100만 원+"
      />
      <Slider
        {...args}
        size="s"
        defaultValue={[10, 60]}
        minLabel="1,000원"
        maxLabel="80만 원"
      />
      <Slider
        {...args}
        size="s"
        defaultValue={30}
        disabled
        minLabel="0원"
        maxLabel="100만 원+"
      />
    </div>
  ),
};
