"use client";

import { Suspense, useRef } from "react";

import type { SellerProduct } from "@/api/seller-studio/api";
import { ProductDetailPage } from "@/app/products/[productSlug]/_components/ProductDetailPage";
import { Footer } from "@/components/common/footer";
import { GnbNav } from "@/components/common/gnb-nav";
import { Header } from "@/components/common/header";
import { useSellerProduct } from "@/queries/seller-studio/queries";
import { useAuthStore } from "@/stores/auth";
import type { ProductDetail } from "@/types/product-detail";
import {
  flattenDocument,
  safeImageUrl,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import { ProductPreviewFrame } from "./ProductPreviewFrame";
import { ServerDocument } from "./ServerDocument";

interface Props {
  productId: number;
  product?: SellerProduct;
  document: StudioDocument;
  images: Record<string, string>;
  width: number;
  fitCanvas?: boolean;
}
export function ServerStudioReview(props: Props) {
  return props.product || props.productId < 1 ? (
    <ReviewContent {...props} />
  ) : (
    <QueriedReview {...props} />
  );
}
function QueriedReview(props: Props) {
  const ownerId = useAuthStore((state) => state.user?.id);
  const query = useSellerProduct(props.productId, ownerId);
  return (
    <ReviewContent
      {...props}
      product={query.data}
      failedQuery={query.isError}
    />
  );
}
function ReviewContent({
  document,
  images,
  width,
  product,
  productId,
  failedQuery,
}: Props & { failedQuery?: boolean }) {
  const categoryTrigger = useRef<HTMLAnchorElement>(null);
  const nodes = flattenDocument(document);
  const sources = [
    ...new Set(
      nodes
        .filter((node) => node.tag === "img")
        .flatMap((node) => {
          const src =
            images[node.props?.imageId ?? ""] ??
            safeImageUrl(node.props?.src) ??
            safeImageUrl(node.props?.imageId);
          return src ? [src] : [];
        }),
    ),
  ];
  const detail: ProductDetail = {
    id: productId,
    name: product?.title ?? "상품 상세페이지 미리보기",
    price: product?.price ?? 0,
    stock: product?.stock ?? null,
    status: product?.stock === 0 ? "SOLD_OUT" : "ON_SALE",
    images: sources.map((src, index) => ({
      src,
      alt: index ? `작품 사진 ${index + 1}` : "작품 대표 사진",
    })),
    description: null,
    artisan: null,
    rating: null,
    reviewCount: 0,
    shipping: null,
    optionGroups: [],
    variants: null,
    content: [],
    specifications: product
      ? [{ label: "제품명", content: product.title }]
      : [],
    notices: [],
    shippingInformation: [],
    relatedProducts: [],
    isMock: true,
  };
  return (
    <ProductPreviewFrame width={width}>
      <div className="sticky top-0 z-50 shadow-nav" inert>
        <Header prefetch={false} />
        <Suspense>
          <GnbNav
            prefetch={false}
            isCategoryPanelOpen={false}
            categoryTriggerRef={categoryTrigger}
            onCategoryTriggerMouseEnter={() => {}}
            onCategoryTriggerFocus={() => {}}
          />
        </Suspense>
      </div>
      {failedQuery && (
        <p role="status" className="px-6 pt-6 text-body-m">
          상품 기본정보를 불러오지 못했습니다. 상세페이지 내용은 아래에서 확인할
          수 있습니다.
        </p>
      )}
      <ProductDetailPage
        key={`${productId}:${product?.stock ?? "unknown"}`}
        product={detail}
        preview={{
          priceKnown: !!product,
          content: (
            <section aria-label="상품 소개" className="py-6">
              <ServerDocument document={document} images={images} fitCanvas />
            </section>
          ),
        }}
      />
      <div inert>
        <Footer />
      </div>
    </ProductPreviewFrame>
  );
}
