import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "padded" },
  args: {
    placeholder: "사유를 작성해주세요.",
    label: "Label",
    maxLength: 2000,
  },
  argTypes: {
    error: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <Textarea {...args} label="default" />
      <Textarea
        {...args}
        label="filled"
        value="상품 사용에 따른 파손이 있었습니다."
        readOnly
      />
      <Textarea
        {...args}
        label="error"
        value="사"
        error="10자 이상 작성해주세요."
        readOnly
      />
      <Textarea {...args} label="disabled" disabled />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: { label: undefined },
};
