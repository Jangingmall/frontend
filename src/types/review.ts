import type { ProductImage } from "./product-detail";

export type ReviewSort = "latest" | "high" | "low";
export interface ProductReview {
  id: number;
  author: string;
  rating: number;
  createdAt: string;
  body: string;
  optionLabel: string;
  images: ProductImage[];
}
export interface ReviewPage {
  items: ProductReview[];
  totalCount: number;
  reviewCount: number;
  rating: number | null;
}
export interface ReviewFilters {
  page: number;
  sort: ReviewSort;
  photoOnly: boolean;
}

/**
 * "빠른 후기 작성" 카드 한 장 — 리뷰 미작성 + DELIVERED(구매확정 여부 무관) 주문 아이템.
 * `options`·`purchasedAt`·`rewardPoints`는 실제 BE(`GET /api/member/me/reviews/writable`)가
 * 아직 안 내려준다(be-requests.md #11) — `OrderDetailItem.options`·`artisanName`과 같은
 * 패턴으로 없으면 화면에서 해당 부분만 생략한다.
 */
export interface ReviewableItem {
  orderItemId: number;
  productId: number;
  productName: string;
  thumbnailUrl: string | null;
  options: string[];
  /** ISO datetime. */
  purchasedAt: string | null;
  /** 정적 표시용 적립금 안내(실제 지급 없음). */
  rewardPoints: number | null;
}

/**
 * "내가 작성한 후기" 목록 한 줄. `orderItemId`·`productName`은 실제 BE
 * (`GET /api/member/me/reviews`)가 아직 안 내려준다(be-requests.md #11).
 */
export interface MyReview {
  id: number;
  orderItemId: number | null;
  productId: number;
  productName: string | null;
  thumbnailUrl: string | null;
  /** 0.5 단위, 0.5~5.0. BE는 정수만 받아 mock-off 시 반올림될 수 있다. */
  rating: number;
  content: string;
  images: { src: string; alt: string }[];
  /** ISO datetime. */
  createdAt: string;
}

export interface MyReviewPage {
  items: MyReview[];
  totalCount: number;
}

/** 작성 모달 제출값 — 작성 전용(수정 없음). */
export interface ReviewFormInput {
  rating: number;
  content: string;
  photos: File[];
}
