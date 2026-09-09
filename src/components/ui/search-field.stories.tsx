import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { SearchField } from "./search-field";

const meta = {
  title: "UI/SearchField",
  component: SearchField,
  parameters: { layout: "padded" },
  args: {
    placeholder: "검색어를 입력해주세요.",
    onSearch: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <SearchField {...args} />
      <SearchField {...args} defaultValue="검색" />
      <SearchField {...args} defaultValue="검색" disabled />
    </div>
  ),
};
