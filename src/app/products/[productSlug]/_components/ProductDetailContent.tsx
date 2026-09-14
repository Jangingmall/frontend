import type { ProductContentBlock } from "@/types/product-detail";

import { ProductDetailImage } from "./ProductDetailImage";

interface ProductDetailContentProps {
  content: ProductContentBlock[];
  description: string;
}

export function ProductDetailContent({
  content,
  description,
}: ProductDetailContentProps) {
  return (
    <section aria-label="상품 소개" className="space-y-6 py-6">
      {content.length ? (
        content.map((block, index) => {
          if (block.type === "image")
            return (
              <div
                key={index}
                className="relative aspect-square w-full bg-fill-jade-weak"
              >
                <ProductDetailImage
                  image={block.image}
                  sizes="(max-width: 1024px) 100vw, 774px"
                  contain
                />
              </div>
            );
          if (block.type === "heading")
            return (
              <h3 key={index} className="px-2 text-title-l">
                {block.text}
              </h3>
            );
          return (
            <p
              key={index}
              className="px-2 text-body-l leading-relaxed whitespace-pre-line text-font-dark-subtle"
            >
              {block.text}
            </p>
          );
        })
      ) : (
        <p className="px-2 text-body-m leading-relaxed whitespace-pre-line text-font-dark-subtle">
          {description || "상품 소개를 준비하고 있습니다."}
        </p>
      )}
    </section>
  );
}
