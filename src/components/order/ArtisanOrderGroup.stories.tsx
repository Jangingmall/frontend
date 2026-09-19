import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArtisanOrderGroup } from "./ArtisanOrderGroup";
const meta = {
  title: "Order/ArtisanOrderGroup",
  component: ArtisanOrderGroup,
  args: {
    artisanName: "장인 이름",
    children: <div className="py-6">주문 상품</div>,
  },
} satisfies Meta<typeof ArtisanOrderGroup>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
