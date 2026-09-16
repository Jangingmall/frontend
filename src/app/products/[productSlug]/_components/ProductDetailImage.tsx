"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product-detail";

interface ProductDetailImageProps {
  image: ProductImage;
  sizes: string;
  isAboveFold?: boolean;
  contain?: boolean;
  decorative?: boolean;
}

export function ProductDetailImage({
  image,
  sizes,
  isAboveFold = false,
  contain = false,
  decorative = false,
}: ProductDetailImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!image.src || failedSource === image.src) {
    return (
      <span
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={`${image.alt} — 이미지를 불러올 수 없습니다`}
        className="absolute inset-0 flex items-center justify-center bg-fill-jade-weak p-4 text-center text-body-s text-font-dark-subtle"
      >
        이미지 준비 중
      </span>
    );
  }
  return (
    <Image
      src={image.src}
      alt={decorative ? "" : image.alt}
      fill
      sizes={sizes}
      unoptimized
      loading={isAboveFold ? "eager" : "lazy"}
      fetchPriority={isAboveFold ? "high" : undefined}
      className={cn(contain ? "object-contain" : "object-cover")}
      onError={() => setFailedSource(image.src)}
    />
  );
}
