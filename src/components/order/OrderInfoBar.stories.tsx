import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentType } from "react";

import type { OrderStatus } from "@/constants/order";

import { OrderInfoBar } from "./OrderInfoBar";

/**
 * `OrderInfoBar`의 props는 `single`/`multi` discriminated union이라 Storybook CSF 타입
 * 추론이 variant 전용 필드를 `never`로 좁힌다(OrderProductCard.stories.tsx와 동일 이슈).
 * 스토리 전용으로 평탄화한 타입을 쓴다.
 */
interface OrderInfoBarStoryArgs {
  variant?: "single" | "multi";
  status?: OrderStatus;
  itemCount?: number;
  orderNumber: string;
  orderDate: string;
}

const meta = {
  title: "Order/OrderInfoBar",
  component: OrderInfoBar as unknown as ComponentType<OrderInfoBarStoryArgs>,
  decorators: [
    (Story) => (
      <div className="w-140">
        <Story />
      </div>
    ),
  ],
  args: {
    orderNumber: "JJ000000",
    orderDate: "2026.08.28",
  },
} satisfies Meta<OrderInfoBarStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PaymentPending: Story = {
  args: { status: "PAYMENT_PENDING" },
};

export const Delivered: Story = {
  args: { status: "DELIVERED" },
};

export const Canceled: Story = {
  args: { status: "CANCELED" },
};

export const Multi: Story = {
  name: "복수 상품 주문",
  args: { variant: "multi", itemCount: 3 },
};
