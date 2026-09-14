import Image from "next/image";
import { useState } from "react";

import type { ProductReview } from "@/types/review";

import { ProductImageLightbox } from "./ProductImageLightbox";
import { ReviewStars } from "./ReviewStars";

interface ReviewItemProps {
  review: ProductReview;
}

export function ReviewItem({ review }: ReviewItemProps) {
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  return (
    <article className="space-y-3 border-b border-border-jade-weak py-3">
      <div>
        <p className="text-body-s-b text-font-dark">{review.author}</p>
        <div className="flex items-center gap-3">
          <ReviewStars rating={review.rating} />
          <time
            className="text-caption text-font-dark-weak"
            dateTime={review.createdAt}
          >
            {review.createdAt.replaceAll("-", ".")}
          </time>
        </div>
      </div>
      <p className="text-body whitespace-pre-wrap text-font-dark-subtle">
        {review.body}
      </p>
      {review.images.length > 0 && (
        <div className="flex gap-1 overflow-x-auto">
          {review.images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              aria-label={`${review.author} 후기 사진 ${index + 1} 크게 보기`}
              onClick={() => setImageIndex(index)}
              className="relative size-30 shrink-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-border-jade-fill"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <p className="text-caption text-font-dark-weak">
        옵션: {review.optionLabel}
      </p>
      <ProductImageLightbox
        images={review.images}
        open={imageIndex !== null}
        initialIndex={imageIndex ?? 0}
        onOpenChange={(open) => {
          if (!open) setImageIndex(null);
        }}
      />
    </article>
  );
}
