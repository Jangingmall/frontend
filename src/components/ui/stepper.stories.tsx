import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Stepper } from "./stepper";

const meta = {
  title: "UI/Stepper",
  component: Stepper,
  parameters: { layout: "padded" },
  args: { size: "m", defaultValue: 1, min: 0, max: 10 },
  argTypes: { size: { control: "inline-radio", options: ["s", "m"] } },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-6">
      <Stepper {...args} size="m" />
      <Stepper {...args} size="s" />
      <Stepper {...args} size="m" defaultValue={0} disabled />
    </div>
  ),
};
