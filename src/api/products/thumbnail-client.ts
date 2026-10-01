import { imageUrl } from "@/api/images/read-model";
import { clientFetch } from "@/lib/http/client";

import { productDetailDto } from "./detail-validation";

// 이미지 보완 때문에 상품의 가격·재고·옵션 계약에 의존하지 않는다.
const productThumbnailDto = productDetailDto.pick({
  productId: true,
  thumbnail: true,
  thumbnailUrl: true,
  images: true,
});

export async function fetchProductThumbnail(productId: number) {
  const product = productThumbnailDto.parse(
    await clientFetch<unknown>("/api/products/" + productId, {
      auth: false,
      signal: AbortSignal.timeout(3000),
    }),
  );
  if (product.productId !== productId) return null;
  return (
    imageUrl(product.thumbnail, product.thumbnailUrl || null) ||
    product.images?.map((image) => imageUrl(image.variants)).find(Boolean) ||
    null
  );
}
