import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Radio, RadioGroup } from "./radio-button";

// Radio 는 `value` 필수 + RadioGroup 컨텍스트가 필요해 개별 컴포넌트로 타입을 묶지 않는다.
const meta = {
  title: "UI/RadioButton",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <RadioGroup defaultValue="b">
      <Radio value="a">옵션 A</Radio>
      <Radio value="b">옵션 B</Radio>
      <Radio value="c">옵션 C</Radio>
      <Radio value="d" disabled>
        옵션 D (disabled)
      </Radio>
    </RadioGroup>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <RadioGroup defaultValue="on" className="flex-row items-center gap-4">
        <Radio value="off" aria-label="default" />
        <Radio value="on" aria-label="selected" />
      </RadioGroup>
      <span className="text-body-s text-font-dark-subtle">
        default / selected
      </span>
    </div>
  ),
};
