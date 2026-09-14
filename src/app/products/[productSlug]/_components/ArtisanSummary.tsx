import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { ProductArtisan } from "@/types/product-detail";

import { ProductDetailImage } from "./ProductDetailImage";

interface ArtisanSummaryProps {
  artisan: ProductArtisan;
}

export function ArtisanSummary({ artisan }: ArtisanSummaryProps) {
  return (
    <section
      aria-label="장인 소개"
      className="flex flex-col bg-bg-subtle sm:flex-row"
    >
      <div className="relative h-70 shrink-0 sm:w-51">
        {artisan.image ? (
          <ProductDetailImage image={artisan.image} sizes="204px" />
        ) : (
          <span
            role="img"
            aria-label={`${artisan.name} 장인 이미지 준비 중`}
            className="flex h-full items-center justify-center bg-fill-jade-weak text-body-s text-font-dark-subtle"
          >
            장인 이미지 준비 중
          </span>
        )}
      </div>
      <div className="flex min-h-70 min-w-0 flex-1 flex-col items-start p-6">
        <div className="mb-3 flex flex-wrap gap-1">
          {artisan.stage && <Badge>{artisan.stage}</Badge>}
          {artisan.craft && <Badge>{artisan.craft}</Badge>}
        </div>
        <h3 className="text-title-m">{artisan.name}</h3>
        <p className="mt-2 text-body-s leading-relaxed whitespace-pre-line text-font-dark-subtle">
          {artisan.introduction || "장인 소개를 준비하고 있습니다."}
        </p>
        <div className="mt-auto self-end pt-6">
          {artisan.href ? (
            <Button
              size="s"
              nativeButton={false}
              render={<Link href={{ pathname: artisan.href }} />}
              className="h-10 pr-4"
            >
              더보기
              <ChevronRightIcon className="size-6 [&_path]:fill-current" />
            </Button>
          ) : (
            <Button
              size="s"
              disabled
              className="h-10"
              aria-label={`${artisan.name} 장인 상세 준비 중`}
            >
              장인 상세 준비 중
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
