import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { AddressCard } from "./AddressCard";

const meta = {
  title: "Member/AddressCard",
  component: AddressCard,
  decorators: [
    (Story) => (
      <div className="w-100">
        <Story />
      </div>
    ),
  ],
  args: {
    onEdit: fn(),
    onDelete: fn(),
    onSetDefault: fn(),
  },
} satisfies Meta<typeof AddressCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    address: {
      id: 1,
      recipientName: "김미담",
      phone: "01011112222",
      zipCode: "06035",
      address1: "서울특별시 강남구 학동로 343",
      address2: "더 피나클 강남 15층",
      isDefault: false,
    },
  },
};

export const DefaultAddress: Story = {
  name: "기본 배송지",
  args: {
    address: {
      id: 2,
      recipientName: "김미담",
      phone: "01011112222",
      zipCode: "13529",
      address1: "경기도 성남시 분당구 판교역로 235",
      address2: "H스퀘어 N동 3층",
      isDefault: true,
    },
  },
};
