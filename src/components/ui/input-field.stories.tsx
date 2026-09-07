import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { InputField } from "./input-field";

const meta = {
  title: "UI/InputField",
  component: InputField,
  parameters: { layout: "padded" },
  args: {
    placeholder: "이메일을 입력해주세요.",
    label: "Label",
    helperText: "Label",
  },
  argTypes: {
    error: { control: "text" },
    type: { control: "inline-radio", options: ["text", "password"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <InputField {...args} label="default" />
      <InputField {...args} label="filled" defaultValue="sample@email.com" />
      <InputField
        {...args}
        label="clearable"
        defaultValue="sample@"
        clearable
      />
      <InputField
        {...args}
        label="password"
        type="password"
        defaultValue="secret1234"
        clearable
      />
      <InputField
        {...args}
        label="error"
        defaultValue="sample@email.com"
        clearable
        error="올바른 이메일 형식이 아닙니다."
      />
      <InputField {...args} label="disabled" disabled />
    </div>
  ),
};

export const WithoutLabels: Story = {
  args: { label: undefined, helperText: undefined },
};
