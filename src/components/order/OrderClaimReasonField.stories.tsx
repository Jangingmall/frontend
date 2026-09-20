import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { ORDER_CANCEL_REASON_OPTIONS } from "@/constants/order";

import {
  OrderClaimReasonField,
  type OrderClaimReasonValue,
} from "./OrderClaimReasonField";

const meta = {
  title: "Order/OrderClaimReasonField",
  component: OrderClaimReasonField,
  parameters: { layout: "padded" },
  args: {
    options: ORDER_CANCEL_REASON_OPTIONS,
    ariaLabel: "취소 사유",
    freeTextPlaceholder: "취소 사유를 작성해주세요.",
    value: { label: "" },
    onChange: () => {},
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OrderClaimReasonField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => {
    function Controlled() {
      const [value, setValue] = useState<OrderClaimReasonValue>({
        label: "",
      });
      return (
        <OrderClaimReasonField {...args} value={value} onChange={setValue} />
      );
    }
    return <Controlled />;
  },
};

export const FreeTextSelected: Story = {
  args: { value: { label: "직접 입력", freeText: "" } },
};

export const WithError: Story = {
  args: { value: { label: "" }, error: "취소 사유를 선택해주세요." },
};
