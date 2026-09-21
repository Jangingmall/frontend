import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { ReviewRatingInput } from "./ReviewRatingInput";

const meta = {
  title: "Review/ReviewRatingInput",
  component: ReviewRatingInput,
  parameters: { layout: "padded" },
  args: {
    value: 0,
    onChange: () => {},
  },
} satisfies Meta<typeof ReviewRatingInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    function Controlled() {
      const [value, setValue] = useState(args.value);
      return <ReviewRatingInput {...args} value={value} onChange={setValue} />;
    }
    return <Controlled />;
  },
};

export const Selected: Story = {
  args: { value: 4.5 },
};

export const WithError: Story = {
  args: { value: 0, error: "별점을 입력해주세요." },
};
