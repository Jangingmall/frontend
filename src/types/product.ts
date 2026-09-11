import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";

/** 공개 상품 목록과 카드가 공유하는 표시 모델. */
export interface ProductSummary {
  id: number;
  name: string;
  price: Money;
  thumbnail: ImageRef;
  artisan: { id: number; name: string };
  craftCategory: string | null;
  /** 후기 0건이면 0이 아닌 null. */
  rating: number | null;
  reviewCount: number;
  primaryBadge: string | null;
  isSoldOut: boolean;
}
