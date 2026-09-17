import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";

/** 공개 상품 목록과 카드가 공유하는 표시 모델. */
export interface ProductSummary {
  id: number;
  name: string;
  price: Money;
  thumbnail: ImageRef | null;
  /** BE의 단일 썸네일 URL. 존재하지 않는 이미지 variant를 생성하지 않는다. */
  thumbnailUrl?: string | null;
  artisan: { id: number; name: string | null };
  craftCategory: string | null;
  /** 후기 0건이면 0이 아닌 null. */
  rating: number | null;
  /** 미제공은 null, 실제 후기 0건은 0. */
  reviewCount: number | null;
  primaryBadge: string | null;
  isSoldOut: boolean;
  colors?: { name: string; hex: string }[];
}
