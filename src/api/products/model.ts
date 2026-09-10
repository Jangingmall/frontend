import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";

/**
 * 상품 목록 카드용 FE 모델. (docs/api-contract.md §5 · IA PL-1/PD-1 카드 명세)
 * 이 도메인이 실제로 소비하는 슬라이스만 담는다. 두 번째 도메인이 쓰기 시작하면
 * `types/`로 승격한다.
 */
export interface ProductSummary {
  id: number;
  name: string;
  price: Money;
  thumbnail: ImageRef;
  artisan: { id: number; name: string };
  /** 종목(국가무형유산 지정 종목) 표시용. 없을 수 있다. */
  craftCategory: string | null;
  /** 후기 0건이면 `null`(0 아님). */
  rating: number | null;
  reviewCount: number;
  /** 대표 배지 값. 라벨은 `constants/badge.productBadgeLabel()`. */
  primaryBadge: string | null;
  /** `status === "SOLD_OUT"` 파생. 품절 오버레이 표시에 쓴다. */
  isSoldOut: boolean;
}
