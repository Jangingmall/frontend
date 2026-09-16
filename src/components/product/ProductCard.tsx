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
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types/product";
import { getProductPath } from "@/utils/product-url";

import { pickThumbnailVariant } from "./product-thumbnail";

interface ProductCardProps {
  product: ProductSummary;
  isWishlisted?: boolean;
  onWishlist?: (productId: number) => void;
  isAboveFold?: boolean;
  variant?: "default" | "list" | "related";
}

export function ProductCard({
  product,
  isWishlisted = false,
  onWishlist,
  isAboveFold = false,
  variant = "default",
}: ProductCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const thumbnail = pickThumbnailVariant(product.thumbnail, 640);
  const href = getProductPath(product);
  const badge = product.primaryBadge
    ? productBadgeLabel(product.primaryBadge)
    : null;

  return (
    <article className="min-w-0 pb-2 text-font-dark">
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
          loading={isAboveFold ? "eager" : "lazy"}
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
      <div
        className={cn(
          "flex items-start justify-between gap-2 pt-2 pl-2",
          variant !== "default" && "gap-0",
        )}
      >
        <div className="min-w-0">
          <Link
            href={{ pathname: href }}
            tabIndex={-1}
            aria-hidden="true"
            className={cn(
              "block truncate text-title-m",
              variant === "related" && "text-body-l leading-[1.3] font-medium",
            )}
          >
            {product.name}
          </Link>
          <p
            className={cn(
              "mt-1 truncate text-body-m",
              variant === "list" && "mt-0 text-font-dark/60",
              variant === "related" && "mt-0 leading-normal text-font-dark/60",
            )}
          >
            {product.artisan.name}
          </p>
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
        <span
          className={cn(
            variant === "related" && "text-body-l leading-normal font-medium",
          )}
        >
          {product.price.toLocaleString("ko-KR")}원
        </span>
        {product.rating !== null && (
          <span
            aria-label={`평점 ${product.rating.toFixed(1)}, 후기 ${product.reviewCount}개`}
            className={cn(
              "inline-flex items-center gap-1",
              variant !== "default" && "gap-0.5 text-font-label",
            )}
          >
            <StarFilledIcon className="size-5" aria-hidden="true" />
            {product.rating.toFixed(1)}
          </span>
        )}
      </div>
      {!!product.colors?.length && (
        <ul aria-label="상품 색상" className="mt-2 flex flex-wrap gap-0.5 px-2">
          {product.colors.map((color) => (
            <li
              key={`${color.name}-${color.hex}`}
              title={color.name}
              className={cn(variant === "list" && "p-0.5")}
            >
              <span
                aria-hidden="true"
                className="block size-4 border border-border-neutral-subtle"
                style={{ backgroundColor: color.hex }}
              />
              <span className="sr-only">{color.name}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
