import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArtisanCarousel } from "./ArtisanCarousel";

const meta = {
  title: "Home/ArtisanCarousel",
  component: ArtisanCarousel,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ArtisanCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 좌우 화살표로 더미 6건을 직접 넘겨볼 수 있다. 전체보기·카드 CTA는 실제 링크가 없다. */
export const Default: Story = {};
