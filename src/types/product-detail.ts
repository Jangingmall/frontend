import type { ProductSummary } from "./product";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductOptionValue {
  id: string;
  label: string;
  priceDelta: number;
  stock: number | null;
}

export interface ProductOptionGroup {
  id: string;
  label: string;
  required: boolean;
  kind: "STANDARD" | "GIFT";
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  /** 일반 옵션의 조합. 선물 포장은 별도 추가금으로 계산한다. */
  valueIds: string[];
  stock: number;
  priceDelta: number;
}

export interface ProductArtisan {
  id: number;
  name: string;
  image: ProductImage | null;
  stage: string;
  craft: string;
  introduction: string;
  /** 장인 상세 route가 준비된 경우에만 제공한다. */
  href: string | null;
}

export type ProductContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; image: ProductImage };

export interface ProductInformationRow {
  label: string;
  content: string;
}

/** 공개 기본 응답과 상세 확장 계약을 분리한 구매자 표시 모델. */
export interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number | null;
  status: "ON_SALE" | "SOLD_OUT";
  images: ProductImage[];
  artisan: ProductArtisan | null;
  rating: number | null;
  reviewCount: number;
  shipping: {
    fee: number | null;
    freeAbove: number | null;
    productionDays: string | null;
  } | null;
  optionGroups: ProductOptionGroup[];
  variants: ProductVariant[] | null;
  content: ProductContentBlock[];
  specifications: ProductInformationRow[];
  notices: ProductInformationRow[];
  shippingInformation: ProductInformationRow[];
  relatedProducts: ProductSummary[];
  /** 실제 응답에 없는 상세 확장은 mock 환경에서만 제공된다. */
  isMock: boolean;
}

export type ProductNotify = (
  message: string,
  action?: { label: string; onClick: () => void },
) => void;
