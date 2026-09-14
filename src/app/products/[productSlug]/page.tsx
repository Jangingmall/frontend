import type { Metadata } from "next";
import type { Route } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { fetchProductDetail } from "@/api/products/detail-api";
import {
  getProductPath,
  isCanonicalProductSlug,
  parseProductId,
} from "@/utils/product-url";

import { ProductDetailPage } from "./_components/ProductDetailPage";

interface ProductPageProps {
  params: Promise<{ productSlug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const id = parseProductId((await params).productSlug);
  const product = id ? await fetchProductDetail(id).catch(() => null) : null;
  if (!product)
    return {
      title: "상품을 찾을 수 없습니다 | 장인몰",
      robots: { index: false, follow: true },
    };
  const description = (product.description ?? product.name).slice(0, 160);
  return {
    title: `${product.name} | 장인몰`,
    description,
    alternates: { canonical: getProductPath(product) },
    openGraph: {
      title: product.name,
      description,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params;
  const id = parseProductId(productSlug);
  if (!id) notFound();
  const product = await fetchProductDetail(id);
  if (!product) notFound();
  const canonical = getProductPath(product);
  if (!isCanonicalProductSlug(product, productSlug)) {
    permanentRedirect(canonical as Route);
  }
  return <ProductDetailPage key={product.id} product={product} />;
}
