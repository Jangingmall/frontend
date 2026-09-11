"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  HeartFilledIcon,
  HeartIcon,
  StarFilledIcon,
} from "@/components/ui/icons";
import { productBadgeLabel } from "@/constants/badge";
import type { ProductSummary } from "@/types/product";

interface ProductCardProps {
  product: ProductSummary;
  isWishlisted?: boolean;
  onWishlist?: (productId: number) => void;
}

export function ProductCard({
  product,
  isWishlisted = false,
  onWishlist,
}: ProductCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const thumbnail =
    product.thumbnail.variants.find((image) => image.width === 640) ??
    product.thumbnail.variants[0];
  const href = `/products/${encodeURIComponent(product.name.trim().replace(/\s+/g, "-"))}-${product.id}`;
  const badge = product.primaryBadge
    ? productBadgeLabel(product.primaryBadge)
    : null;

  return (
    <article className="min-w-0 text-font-dark">
      <Link
        href={{ pathname: href }}
        aria-label={product.name}
        className="relative block aspect-square overflow-hidden bg-fill-jade-weak focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill"
      >
        <Image
          src={
            hasImageError || !thumbnail
              ? "/images/product-placeholder.png"
              : thumbnail.url
          }
          alt=""
          fill
          unoptimized
          className="object-cover"
          onError={() => setHasImageError(true)}
        />
        {badge && (
          <Badge variant="solid" className="absolute top-2 right-2">
            {badge}
          </Badge>
        )}
        {product.isSoldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-bg-default/60 text-title-m">
            품절
          </span>
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 pt-3 pl-2">
        <div className="min-w-0">
          <p className="truncate text-body-m text-font-dark-subtle">
            {product.artisan.name}
          </p>
          <Link
            href={{ pathname: href }}
            tabIndex={-1}
            aria-hidden="true"
            className="mt-1 block truncate text-title-m"
          >
            {product.name}
          </Link>
        </div>
        <button
          type="button"
          aria-label={`${product.name} ${isWishlisted ? "찜 취소" : "찜하기"}`}
          aria-pressed={isWishlisted}
          disabled={!onWishlist}
          title={onWishlist ? undefined : "찜 기능 준비 중"}
          onClick={() => onWishlist?.(product.id)}
          className="flex size-9 shrink-0 items-center justify-center rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-border-jade-fill disabled:cursor-default"
        >
          {isWishlisted ? (
            <HeartFilledIcon className="size-6" />
          ) : (
            <HeartIcon className="size-6" />
          )}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2 text-body-m">
        <span>{product.price.toLocaleString("ko-KR")}원</span>
        {product.rating !== null && (
          <span
            aria-label={`평점 ${product.rating.toFixed(1)}, 후기 ${product.reviewCount}개`}
            className="inline-flex items-center gap-1"
          >
            <StarFilledIcon className="size-5" aria-hidden="true" />
            {product.rating.toFixed(1)}
          </span>
        )}
      </div>
      {!!product.colors?.length && (
        <ul aria-label="상품 색상" className="mt-2 flex flex-wrap gap-1 px-2">
          {product.colors.map((color) => (
            <li
              key={`${color.name}-${color.hex}`}
              title={color.name}
              className="size-5 border border-border-neutral-subtle p-0.5"
            >
              <span
                className="block size-full"
                style={{ backgroundColor: color.hex }}
              >
                <span className="sr-only">{color.name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
