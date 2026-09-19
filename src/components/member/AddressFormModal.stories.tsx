import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { AddressFormModal } from "./AddressFormModal";

const meta = {
  title: "Member/AddressFormModal",
  component: AddressFormModal,
  args: {
    open: true,
    onOpenChange: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof AddressFormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {
  name: "배송지 추가",
  args: { mode: "add" },
};

export const Edit: Story = {
  name: "배송지 수정",
  args: {
    mode: "edit",
    initialValue: {
      id: 1,
      recipientName: "김미담",
      phone: "01011112222",
      zipCode: "06035",
      address1: "서울특별시 강남구 학동로 343",
      address2: "더 피나클 강남 15층",
      isDefault: true,
    },
  },
};

export const SubmitError: Story = {
  name: "제출 실패",
  args: {
    mode: "add",
    submitError: "배송지를 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
  },
};
