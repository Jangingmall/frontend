import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { OrderClaimPhotoField } from "./OrderClaimPhotoField";

const meta = {
  title: "Order/OrderClaimPhotoField",
  component: OrderClaimPhotoField,
  parameters: { layout: "padded" },
  args: {
    value: [],
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderClaimPhotoField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Optional: Story = {
  render: (args) => {
    function Controlled() {
      const [value, setValue] = useState<File[]>([]);
      return (
        <OrderClaimPhotoField {...args} value={value} onChange={setValue} />
      );
    }
    return <Controlled />;
  },
};

export const Required: Story = {
  args: { required: true },
  render: (args) => {
    function Controlled() {
      const [value, setValue] = useState<File[]>([]);
      return (
        <OrderClaimPhotoField {...args} value={value} onChange={setValue} />
      );
    }
    return <Controlled />;
  },
};

export const WithError: Story = {
  args: { required: true, error: "사진을 1장 이상 첨부해주세요." },
};
