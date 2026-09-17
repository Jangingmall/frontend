import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { PaymentsMethod } from "./PaymentsMethod";

const meta = {
  title: "Order/PaymentsMethod",
  component: PaymentsMethod,
  decorators: [
    (Story) => (
      <div className="w-140">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PaymentsMethod>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<
        "REALTIME_TRANSFER" | "BANK_TRANSFER" | "CARD" | "TOSS_PAY"
      >();
      return <PaymentsMethod value={value} onChange={setValue} />;
    }
    return <Demo />;
  },
};

export const BankTransferSelected: Story = {
  name: "무통장입금 선택 시 안내 박스",
  args: { value: "BANK_TRANSFER" },
};

export const BankTransferWithAccount: Story = {
  name: "무통장입금 — 실제 계좌 정보",
  args: {
    value: "BANK_TRANSFER",
    bankAccountInfo: {
      bankName: "신한은행",
      accountNumber: "110-000-000000",
      accountHolder: "장인몰",
    },
  },
};
