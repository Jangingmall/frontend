"use client";

import Image from "next/image";
import { useState } from "react";

import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";

import { pickThumbnailVariant } from "./product-thumbnail";

interface ProductOrderProps {
  thumbnail: ImageRef;
  productName: string;
  /** "− 옵션 내용" 줄. 없거나 빈 배열이면 옵션 영역을 표시하지 않는다. */
  options?: string[];
  quantity: number;
  price: Money;
  /** "주문 유의사항" 안내문. 없으면 description 영역을 표시하지 않는다. */
  note?: string;
}

/** 장바구니·주문서에서 상품 한 줄을 보여주는 순수 프레젠테이션 컴포넌트. */
export function ProductOrder({
  thumbnail,
  productName,
  options,
  quantity,
  price,
  note,
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
        </div>
        <div className="flex min-w-0 flex-1 items-end justify-between gap-4">
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
          <p className="shrink-0 text-body-s">
            {quantity}개 / {price.toLocaleString("ko-KR")}원
          </p>
        </div>
      </div>
      {note && (
        <div className="mt-2 flex flex-wrap gap-x-10 gap-y-1 bg-bg-subtle p-2 text-caption text-font-dark-subtle">
          <span className="shrink-0 text-caption-b">주문 유의사항</span>
          {note}
        </div>
      )}
    </div>
  );
}
