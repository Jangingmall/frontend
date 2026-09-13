import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { JSX } from "react";

import { mapProductSummary } from "@/api/products/mapper";
import { productCatalogue } from "@/api/products/mock/catalogue";

import { ProductCard } from "./ProductCard";

const product = mapProductSummary(productCatalogue[0]);

/**
 * 디자인 시스템 `product-comp` 기준 목록 그리드 셀 폭(260px). `Sizes` 스토리는 여러 폭을
 * 동시에 비교해야 해서 이 decorator를 쓰지 않고 직접 폭을 지정한다.
 */
function withListWidth(Story: () => JSX.Element) {
  return (
    <div className="w-65">
      <Story />
    </div>
  );
}

const meta = {
  title: "Product/ProductCard",
  component: ProductCard,
  args: { product },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { decorators: [withListWidth] };
export const SoldOut: Story = {
  decorators: [withListWidth],
  args: { product: { ...product, isSoldOut: true } },
};
export const NoReviews: Story = {
  decorators: [withListWidth],
  args: {
    product: { ...product, rating: null, reviewCount: 0, primaryBadge: null },
  },
};
export const Wishlisted: Story = {
  decorators: [withListWidth],
  args: { isWishlisted: true, onWishlist: () => {} },
};
export const LongName: Story = {
  decorators: [withListWidth],
  args: {
    product: {
      ...product,
      name: "장인의 정성과 전통을 담아 정성스럽게 빚은 백자 달항아리",
    },
  },
};

/**
 * 디자인 시스템 `product-comp`은 242/256/260/318px 4개 폭을 지원한다(Figma
 * `[FE] Components` 참고). 컴포넌트는 폭을 스스로 정하지 않고 부모가 준 폭에 맞춰
 * 유동적으로 렌더되므로, 코드 변경 없이 감싸는 폭만 바꿔 4사이즈를 확인한다.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {(
        [
          { width: 242, className: "w-60.5" },
          { width: 256, className: "w-64" },
          { width: 260, className: "w-65" },
          { width: 318, className: "w-79.5" },
        ] as const
      ).map(({ width, className }) => (
        <div key={width} className={className}>
          <p className="mb-2 text-caption text-font-dark-subtle">{width}px</p>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  ),
};
