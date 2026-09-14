import type { ProductDetail } from "@/types/product-detail";

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
    description: dto.description ?? "",
    price: dto.price,
    stock: dto.stock ?? null,
    status: dto.status,
    images: dto.thumbnailUrl ? [{ src: dto.thumbnailUrl, alt: dto.title }] : [],
    artisan: null,
    rating: null,
    reviewCount: 0,
    shipping: null,
    optionGroups: [],
    variants: null,
    content: [],
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
