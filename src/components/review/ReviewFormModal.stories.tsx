import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { ReviewFormModal } from "./ReviewFormModal";

const meta = {
  title: "Review/ReviewFormModal",
  component: ReviewFormModal,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onOpenChange: () => {},
    item: {
      productName: "백자 달항아리",
      thumbnailUrl: "https://cdn.midam.store/products/1.jpg",
      options: ["색상: 백자색", "사이즈: 중"],
    },
    purchasedAt: "2026-09-05T00:00:00.000Z",
    onSubmit: () => {},
  },
} satisfies Meta<typeof ReviewFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    function Controlled() {
      const [open, setOpen] = useState(true);
      return <ReviewFormModal {...args} open={open} onOpenChange={setOpen} />;
    }
    return <Controlled />;
  },
};

export const Submitting: Story = {
  args: { submitting: true },
};

export const WithSubmitError: Story = {
  args: { submitError: "후기 등록 중 문제가 발생했어요. 다시 시도해주세요." },
};
