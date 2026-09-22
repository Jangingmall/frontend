import type {
  ProductContentBlock,
  ProductDetail,
} from "@/types/product-detail";

import type {
  ProductDetailDto,
  ProductDetailMockDto,
} from "./detail-validation";
import { mapProductSummary } from "./mapper";

export function mapProductDetail(dto: ProductDetailDto): ProductDetail | null {
  if (dto.status !== "ON_SALE" && dto.status !== "SOLD_OUT") return null;
  return {
    id: dto.productId,
    name: dto.title,
    description: dto.description,
    price: dto.price,
    stock: dto.stock ?? null,
    status: dto.status,
    images: dto.images?.some((image) => image.variants?.length)
      ? dto.images.flatMap((image) =>
          image.variants?.length
            ? [
                {
                  src: image.variants[image.variants.length - 1].url,
                  alt: image.alt ?? dto.title,
                },
              ]
            : [],
        )
      : dto.thumbnailUrl
        ? [{ src: dto.thumbnailUrl, alt: dto.title }]
        : [],
    artisan: null,
    rating: null,
    reviewCount: 0,
    shipping:
      dto.productionPeriodDays == null
        ? null
        : {
            fee: null,
            freeAbove: null,
            productionDays: `${dto.productionPeriodDays}일`,
          },
    optionGroups: [],
    variants: null,
    content: [...(dto.detailPageBlocks ?? [])]
      .sort((a, b) => a.order - b.order)
      .flatMap((block): ProductContentBlock[] => {
        const content: ProductContentBlock[] = [];
        if (block.hasImage && block.imageVariants?.length)
          content.push({
            type: "image",
            image: {
              src: block.imageVariants[block.imageVariants.length - 1].url,
              alt: dto.title,
            },
          });
        if (block.text)
          content.push({
            type: /^h[1-6]$/i.test(block.tag) ? "heading" : "paragraph",
            text: block.text,
          });
        return content;
      }),
    specifications: [],
    notices: [],
    shippingInformation: [],
    relatedProducts: [],
    isMock: false,
  };
}

export function mapProductDetailMock(
  dto: ProductDetailMockDto,
): ProductDetail | null {
  const product = mapProductDetail(dto);
  if (!product) return null;
  return {
    ...product,
    ...dto.detail,
    relatedProducts: dto.detail.relatedProducts.map(mapProductSummary),
    isMock: true,
  };
}
