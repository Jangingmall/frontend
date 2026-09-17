import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentType } from "react";

import { mapProductSummary } from "@/api/products/mapper";
import { productListPage1 } from "@/api/products/mock/fixtures";
import type { OrderCardActionType, OrderStatus } from "@/constants/order";
import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";

import { OrderProductCard } from "./OrderProductCard";

const thumbnail = mapProductSummary(productListPage1.items[0]).thumbnail;

/**
 * `OrderProductCard`의 props는 `detailed`/`compact` discriminated union이라, Storybook의
 * CSF 타입 추론(`Meta<typeof Component>`)이 variant 전용 필드(status/reason/...)를
 * `never`로 좁혀버린다. 스토리 전용으로 필드를 전부 평탄화한 타입을 따로 써서 우회한다.
 */
interface OrderProductCardStoryArgs {
  thumbnail: ImageRef;
  productName: string;
  price: Money;
  onViewDetail?: () => void;
  variant?: "detailed" | "compact";
  status?: OrderStatus;
  reason?: string;
  showStatusBadge?: boolean;
  onAction?: (action: OrderCardActionType) => void;
}

const meta = {
  title: "Order/OrderProductCard",
  component:
    OrderProductCard as unknown as ComponentType<OrderProductCardStoryArgs>,
  decorators: [
    (Story) => (
      <div className="w-140">
        <Story />
      </div>
    ),
  ],
  args: {
    thumbnail,
    productName: "백자 달항아리",
    price: 320000,
  },
} satisfies Meta<OrderProductCardStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PaymentPending: Story = {
  args: { status: "PAYMENT_PENDING" },
};

export const OrderPending: Story = {
  args: { status: "ORDER_PENDING" },
};

export const Preparing: Story = {
  args: { status: "PREPARING" },
};

export const Shipping: Story = {
  args: { status: "SHIPPING" },
};

export const Delivered: Story = {
  args: { status: "DELIVERED" },
};

export const PurchaseConfirmed: Story = {
  args: { status: "PURCHASE_CONFIRMED" },
};

export const CanceledByBuyer: Story = {
  args: { status: "CANCELED" },
};

export const CanceledByArtisan: Story = {
  args: {
    status: "CANCELED",
    reason: "주문 승인 거절 ( 작업 불가 )",
  },
};

export const ExchangeRequested: Story = {
  args: { status: "EXCHANGE_REQUESTED" },
};

export const ExchangeRejected: Story = {
  args: {
    status: "EXCHANGE_REJECTED",
    reason: "상품 사용에 따른 파손",
  },
};

export const ExchangeApproved: Story = {
  args: { status: "EXCHANGE_APPROVED" },
};

export const RefundRequested: Story = {
  args: { status: "REFUND_REQUESTED" },
};

export const RefundRejected: Story = {
  args: {
    status: "REFUND_REJECTED",
    reason: "상품 사용에 따른 파손",
  },
};

export const RefundApproved: Story = {
  args: { status: "REFUND_APPROVED" },
};

export const RefundCompleted: Story = {
  args: { status: "REFUND_COMPLETED" },
};

export const MultiOrderExpandedItem: Story = {
  name: "다중 주문 펼침 (showStatusBadge)",
  args: { status: "PREPARING", showStatusBadge: true },
};

export const Compact: Story = {
  name: "복수주문 축약 카드",
  args: { variant: "compact" },
};
