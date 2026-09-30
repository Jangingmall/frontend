import type { Metadata } from "next";
import type { Route } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { fetchProductPageDetail as fetchProductDetail } from "@/api/products/demo-detail-server";
import { publicEnv } from "@/lib/env";
import {
  getProductPath,
  isCanonicalProductSlug,
  parseProductId,
} from "@/utils/product-url";

import { ProductDetailPage } from "./_components/ProductDetailPage";

interface ProductPageProps {
  params: Promise<{ productSlug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ProductPageProps): Promise<Metadata> {
  const id = parseProductId((await params).productSlug);
  if ((await searchParams)?.preview === "1" && !publicEnv.apiMocking)
    return { robots: { index: false, follow: false } };
  const product = id
    ? await fetchProductDetail(id, (await searchParams)?.preview === "1")
    : null;
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

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { productSlug } = await params;
  const id = parseProductId(productSlug);
  if (!id) notFound();
  const preview = (await searchParams)?.preview === "1";
  const product = await fetchProductDetail(id, preview);
  if (!product) notFound();
  const canonical = getProductPath(product);
  if (!isCanonicalProductSlug(product, productSlug)) {
    permanentRedirect((canonical + (preview ? "?preview=1" : "")) as Route);
  }
  return (
    <>
      {preview && (
        <p role="status" className="p-3 text-center text-body-s">
          시연 상품 · 주문과 결제는 실제로 처리되지 않습니다.
        </p>
      )}
      <ProductDetailPage key={product.id} product={product} />
    </>
  );
}
