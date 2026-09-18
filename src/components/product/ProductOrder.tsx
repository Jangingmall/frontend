"use client";

import Image from "next/image";
import { type ReactNode, useState } from "react";

import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";
import { pickThumbnailVariant } from "@/utils/image";

interface ProductOrderProps {
  thumbnail: ImageRef;
  productName: string;
  /** "− 옵션 내용" 줄. 없거나 빈 배열이면 옵션 영역을 표시하지 않는다. */
  options?: string[];
  quantity: number;
  price: Money;
  /** "주문 유의사항" 안내문. 없으면 description 영역을 표시하지 않는다. */
  note?: string;
  variant?: "inline" | "stacked";
  actions?: ReactNode;
  quantityControl?: ReactNode;
  thumbnailOverlay?: ReactNode;
}

/** 장바구니·주문서에서 상품 한 줄을 보여주는 순수 프레젠테이션 컴포넌트. */
export function ProductOrder({
  thumbnail,
  productName,
  options,
  quantity,
  price,
  note,
  variant: layout = "inline",
  actions,
  quantityControl,
  thumbnailOverlay,
}: ProductOrderProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const variant = pickThumbnailVariant(thumbnail, 320);

  return (
    <div className="text-font-dark">
      <div className="flex items-start gap-4">
        <div className="relative size-22.5 shrink-0 overflow-hidden bg-fill-jade-weak">
          <Image
            src={
              hasImageError || !variant
                ? "/images/product-placeholder.png"
                : variant.url
            }
            alt=""
            fill
            unoptimized
            className="object-cover"
            onError={() => setHasImageError(true)}
          />
          {thumbnailOverlay}
        </div>
        <div
          className={
            layout === "stacked"
              ? "flex min-h-22.5 min-w-0 flex-1 flex-col justify-between gap-3"
              : "flex min-w-0 flex-1 items-end justify-between gap-4"
          }
        >
          <div className="min-w-0">
            <p className="truncate text-body-s-b">{productName}</p>
            {!!options?.length && (
              <ul className="mt-2 flex flex-col gap-1">
                {options.map((option) => (
                  <li
                    key={option}
                    className="truncate text-caption text-font-dark-subtle"
                  >
                    − {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {layout === "inline" ? (
            <p className="shrink-0 text-body-s">
              {quantity}개 / {price.toLocaleString("ko-KR")}원
            </p>
          ) : (
            <div className="self-end">{actions}</div>
          )}
        </div>
      </div>
      {layout === "stacked" && (
        <div className="mt-3 flex items-center justify-end gap-6 border-t border-border-neutral-weak py-3">
          {quantityControl ?? <span className="text-body-s">{quantity}개</span>}
          <p className="text-body-m font-bold">
            {price.toLocaleString("ko-KR")}원
          </p>
        </div>
      )}
      {note && (
        <div className="mt-2 flex flex-wrap gap-x-10 gap-y-1 bg-bg-subtle p-2 text-caption text-font-dark-subtle">
          <span className="shrink-0 text-caption-b">주문 유의사항</span>
          {note}
        </div>
      )}
    </div>
  );
}
