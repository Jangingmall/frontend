"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product-detail";

import { ProductDetailImage } from "./ProductDetailImage";
import { ProductImageLightbox } from "./ProductImageLightbox";

interface ProductDetailGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductDetailGallery({
  images,
  productName,
}: ProductDetailGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const galleryImages = images.slice(0, 6);
  const activeIndex = Math.min(
    selectedIndex,
    Math.max(0, galleryImages.length - 1),
  );
  const selectedImage = galleryImages[activeIndex];
  if (!selectedImage) {
    return (
      <div
        role="img"
        aria-label={`${productName} 이미지 준비 중`}
        className="flex aspect-square items-center justify-center bg-fill-jade-weak text-body-m text-font-dark-subtle"
      >
        이미지 준비 중
      </div>
    );
  }
  return (
    <section
      aria-label="상품 이미지"
      className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:gap-6"
    >
      <div className="flex w-full shrink-0 gap-1 overflow-x-auto p-px sm:w-22.5 sm:flex-col sm:overflow-visible sm:p-0">
        {galleryImages.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            aria-label={`${index + 1}번 이미지 보기`}
            aria-pressed={index === activeIndex}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative aspect-square w-16 shrink-0 overflow-hidden bg-fill-jade-weak outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill sm:w-full",
              index === activeIndex &&
                "ring-1 ring-border-jade-fill ring-inset",
            )}
          >
            <ProductDetailImage image={image} sizes="90px" decorative />
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={`${productName} 이미지 확대`}
        onClick={() => setIsLightboxOpen(true)}
        className="relative aspect-square w-full min-w-0 overflow-hidden bg-fill-jade-weak outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill sm:flex-1"
      >
        <ProductDetailImage
          image={{ ...selectedImage, alt: selectedImage.alt || productName }}
          sizes="660px"
          isAboveFold={activeIndex === 0}
        />
      </button>
      <ProductImageLightbox
        images={galleryImages}
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        initialIndex={activeIndex}
      />
    </section>
  );
}
