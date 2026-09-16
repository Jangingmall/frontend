import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProductDetailGallery } from "./ProductDetailGallery";

const meta = {
  title: "Product/DetailGallery",
  component: ProductDetailGallery,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-193.5">
        <Story />
      </div>
    ),
  ],
  args: { productName: "나전칠기 보석함", images: [] },
} satisfies Meta<typeof ProductDetailGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Images: Story = {
  args: {
    images: [
      { src: "/images/product-placeholder.png", alt: "작품 정면" },
      { src: "/images/product-placeholder.png", alt: "작품 측면" },
    ],
  },
};
export const ImageError: Story = {
  args: { images: [{ src: "/missing-product-image.png", alt: "작품 정면" }] },
};
