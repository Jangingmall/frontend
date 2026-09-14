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
