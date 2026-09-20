import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { OrderExchangeRefundRequestModal } from "./OrderExchangeRefundRequestModal";

const meta = {
  title: "Order/OrderExchangeRefundRequestModal",
  component: OrderExchangeRefundRequestModal,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onOpenChange: () => {},
    item: {
      productName: "백자 달항아리",
      price: 320000,
      quantity: 1,
      thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
    },
    orderItemId: 1,
    purchasedAt: "2026-09-05T00:00:00.000Z",
    orderNumber: "JJ000000",
    onSubmit: () => {},
  },
} satisfies Meta<typeof OrderExchangeRefundRequestModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <OrderExchangeRefundRequestModal
          {...args}
          open={open}
          onOpenChange={setOpen}
        />
      );
    }
    return <Controlled />;
  },
};

export const Submitting: Story = {
  args: { submitting: true },
};

export const WithSubmitError: Story = {
  args: { submitError: "신청 중 문제가 발생했어요. 다시 시도해주세요." },
};
