"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product-detail";

import { ProductDetailImage } from "./ProductDetailImage";

interface ProductImageLightboxProps {
  images: ProductImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

export function ProductImageLightbox({
  images,
  open,
  onOpenChange,
  initialIndex = 0,
}: ProductImageLightboxProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="상품 이미지 확대"
      hideTitle
      onClick={(event) => {
        // 전체 화면 Popup의 투명한 영역도 배경으로 취급한다.
        if (
          event.target instanceof Element &&
          !event.target.closest("button, [data-lightbox-image]")
        ) {
          onOpenChange(false);
        }
      }}
      className="h-full max-w-none bg-transparent p-0 pt-7.5 text-font-white shadow-none [&_[data-slot=dialog-close]]:fixed [&_[data-slot=dialog-close]]:top-13.5 [&_[data-slot=dialog-close]]:right-13.5 [&_[data-slot=dialog-close]]:size-10 [&_[data-slot=dialog-close]>svg]:size-10"
    >
      {open && <LightboxImages images={images} initialIndex={initialIndex} />}
    </Dialog>
  );
}

interface LightboxImagesProps {
  images: ProductImage[];
  initialIndex: number;
}

function LightboxImages({ images, initialIndex }: LightboxImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const activeIndex = Math.min(
    Math.max(selectedIndex, 0),
    Math.max(images.length - 1, 0),
  );
  const selectedImage = images[activeIndex];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedIndex(
          Math.min(
            Math.max(activeIndex + (event.key === "ArrowRight" ? 1 : -1), 0),
            Math.max(images.length - 1, 0),
          ),
        );
      }
    }
    // Base UI Popup은 방향키 버블링을 막으므로 확대 화면에서만 캡처 단계에 처리한다.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [activeIndex, images.length]);

  if (!selectedImage)
    return <p className="p-10 text-center text-body-m">이미지 준비 중</p>;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-223 items-center justify-center gap-2 sm:gap-8">
        <button
          type="button"
          aria-label="이전 이미지"
          disabled={activeIndex === 0}
          onClick={() => setSelectedIndex(activeIndex - 1)}
          className="flex size-8 shrink-0 items-center justify-center outline-none focus-visible:outline-2 focus-visible:outline-border-white disabled:opacity-30 sm:size-16"
        >
          <ChevronLeftIcon className="size-full [&_path]:fill-current" />
        </button>
        <div
          data-lightbox-image
          className="relative aspect-square max-h-[calc(100dvh-200px)] min-w-0 flex-1"
        >
          <ProductDetailImage
            image={selectedImage}
            sizes="(max-width: 1024px) 75vw, 700px"
            contain
          />
        </div>
        <button
          type="button"
          aria-label="다음 이미지"
          disabled={activeIndex === images.length - 1}
          onClick={() => setSelectedIndex(activeIndex + 1)}
          className="flex size-8 shrink-0 items-center justify-center outline-none focus-visible:outline-2 focus-visible:outline-border-white disabled:opacity-30 sm:size-16"
        >
          <ChevronRightIcon className="size-full [&_path]:fill-current" />
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {activeIndex + 1} / {images.length}
      </p>
      <div
        className="flex max-w-full gap-1 overflow-x-auto"
        aria-label="확대 이미지 선택"
      >
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            aria-label={`${index + 1}번 확대 이미지 보기`}
            aria-pressed={index === activeIndex}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative size-24 shrink-0 overflow-hidden border border-transparent p-0.5 outline-none focus-visible:outline-2 focus-visible:outline-border-white",
              index === activeIndex && "border-border-white",
            )}
          >
            <span className="relative block size-22.5">
              <ProductDetailImage image={image} sizes="90px" decorative />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
