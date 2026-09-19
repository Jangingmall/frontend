import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CheckoutPage } from "./CheckoutPage";
const meta = {
  title: "Pages/Checkout",
  component: CheckoutPage,
  parameters: { layout: "fullscreen" },
  argTypes: {
    outcome: {
      control: "select",
      options: ["success", "bank-pending", "declined", "timeout", "cancelled"],
    },
  },
} satisfies Meta<typeof CheckoutPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const filled = {
  customerName: "홍길동",
  email: "midam@example.com",
  customerPhoneFirst: "010",
  customerPhoneMiddle: "1234",
  customerPhoneLast: "5678",
  recipientName: "홍길동",
  recipientPhoneFirst: "010",
  recipientPhoneMiddle: "1234",
  recipientPhoneLast: "5678",
  postcode: "00000",
  address: "서울특별시 강남구 선릉로 123",
  addressDetail: "101동 1234호",
};
export const Default: Story = {};
export const Typing: Story = {
  args: { initialValues: { customerName: "홍", email: "example" } },
};
export const Filled: Story = { args: { initialValues: filled } };
export const MemoSelected: Story = {
  args: { initialValues: { ...filled, memo: "배송 전 연락 바랍니다." } },
};
export const DirectMemoEmpty: Story = {
  args: { initialValues: { memo: "직접 입력" } },
};
export const DirectMemoTyping: Story = {
  args: { initialValues: { memo: "직접 입력", memoText: "빠른 배송" } },
};
export const DirectMemoFilled: Story = {
  args: {
    initialValues: { memo: "직접 입력", memoText: "배송 전 연락 바랍니다." },
  },
};
export const TermsWarning: Story = {
  args: { initialWarning: "약관에 동의해 주세요." },
};
export const MethodWarning: Story = {
  args: { initialValues: filled, initialWarning: "결제수단을 선택해 주세요." },
};
export const BankTransfer: Story = {
  args: { initialValues: filled, initialMethod: "BANK_TRANSFER" },
};
export const CardDeclined: Story = {
  args: {
    initialValues: filled,
    initialMethod: "CARD",
    initialFeedback: "declined",
  },
};
export const Timeout: Story = {
  args: {
    initialValues: filled,
    initialMethod: "CARD",
    initialFeedback: "timeout",
  },
};
export const Cancelled: Story = {
  args: {
    initialValues: filled,
    initialMethod: "CARD",
    initialFeedback: "cancelled",
  },
};
