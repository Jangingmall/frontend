import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { mapProductSummary } from "@/api/products/mapper";
import { productCatalogue } from "@/api/products/mock/catalogue";

import { ProductCard } from "./ProductCard";

const product = mapProductSummary(productCatalogue[0]);
const meta = {
  title: "Product/ProductCard",
  component: ProductCard,
  decorators: [
    (Story) => (
      <div className="w-65">
        <Story />
      </div>
    ),
  ],
  args: { product },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SoldOut: Story = {
  args: { product: { ...product, isSoldOut: true } },
};
export const NoReviews: Story = {
  args: {
    product: { ...product, rating: null, reviewCount: 0, primaryBadge: null },
  },
};
export const Wishlisted: Story = {
  args: { isWishlisted: true, onWishlist: () => {} },
};
export const LongName: Story = {
  args: {
    product: {
      ...product,
      name: "장인의 정성과 전통을 담아 정성스럽게 빚은 백자 달항아리",
    },
  },
};
