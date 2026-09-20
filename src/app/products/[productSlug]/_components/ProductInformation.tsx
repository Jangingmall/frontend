import {
  PRODUCT_NOTICES,
  PRODUCT_SHIPPING_INFORMATION,
} from "@/constants/product-information";
import type { ProductDetail } from "@/types/product-detail";

import { ArtisanSummary } from "./ArtisanSummary";
import { ProductDetailContent } from "./ProductDetailContent";
import { ProductInformationAccordion } from "./ProductInformationAccordion";
import { ProductSectionNav } from "./ProductSectionNav";
import { ProductSpecifications } from "./ProductSpecifications";

interface ProductInformationProps {
  product: ProductDetail;
}

export function ProductInformation({ product }: ProductInformationProps) {
  return (
    <div className="space-y-6">
      <ProductSectionNav />
      <div id="product-information" className="scroll-mt-40">
        {product.artisan && <ArtisanSummary artisan={product.artisan} />}
        <ProductDetailContent
          content={product.content}
          description={product.description}
        />
        <ProductSpecifications rows={product.specifications} />
      </div>
      <ProductInformationAccordion
        id="product-notices"
        title="유의사항"
        rows={product.notices.length ? product.notices : PRODUCT_NOTICES}
      />
      <ProductInformationAccordion
        id="product-shipping"
        title="배송안내"
        rows={
          product.shippingInformation.length
            ? product.shippingInformation
            : PRODUCT_SHIPPING_INFORMATION
        }
      />
    </div>
  );
}
