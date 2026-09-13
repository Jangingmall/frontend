import { seedImageId } from "@/mocks/seed";
import type { ImageRef, ImageVariantWidth } from "@/types/image";
import type { ProductSummary } from "@/types/product";

const IMAGE_VARIANT_WIDTHS: readonly ImageVariantWidth[] = [320, 640, 1280];

/**
 * 실제 상품이 아니라 로컬 플레이스홀더 이미지를 직접 가리키는 `ImageRef`.
 *
 * `mocks/seed`의 `seedImageRef`는 존재하지 않는 `cdn.example.com` URL을 만들어서,
 * `ProductCard`의 `onError` 폴백(`/images/product-placeholder.png`)에 의존한다 —
 * 로컬 개발 서버·CI 샌드박스에 따라 그 외부 도메인 요청이 빠르게 실패(error 이벤트 발생)
 * 하지 않고 계속 pending 상태로 남을 수 있어(`img.complete === false`가 안 끝남),
 * onError가 아예 안 불려 화면엔 브라우저 기본 "이미지 깨짐" 아이콘만 남는다. 기획전은
 * 애초에 실제 이미지가 없는 게 맞는 섹션이라, 처음부터 성공적으로 로드되는 로컬 플레이스홀더
 * URL을 직접 참조해 이 문제를 피한다.
 */
function placeholderImageRef(seq: number): ImageRef {
  return {
    imageId: seedImageId(seq),
    variants: IMAGE_VARIANT_WIDTHS.map((width) => ({
      width,
      url: "/images/product-placeholder.png",
      format: "webp",
    })),
  };
}

/**
 * 홈 "기획전" 섹션 더미 상품 4건. IA 명시대로 실제 API 연동 없이 노출만 한다
 * (design.md §0.2 "기획전"). `ProductSummary` 형태를 그대로 채워 `ProductCard`를
 * 그대로 재사용할 수 있게 한다 — 카드·전체보기 클릭 비활성은 `PromotionSection`이
 * `inert`로 처리한다(§3 "구현 후 재검증" 참고).
 */
export const PROMOTION_PRODUCTS: readonly ProductSummary[] = [
  {
    id: -1,
    name: "무명 행주 3매 세트",
    price: 12000,
    thumbnail: placeholderImageRef(9001),
    artisan: { id: -1, name: "정직조" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
  {
    id: -2,
    name: "대나무 수저받침",
    price: 8000,
    thumbnail: placeholderImageRef(9002),
    artisan: { id: -2, name: "박죽공" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
  {
    id: -3,
    name: "옹기 양념 종지",
    price: 15000,
    thumbnail: placeholderImageRef(9003),
    artisan: { id: -3, name: "김옹기" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
  {
    id: -4,
    name: "삼베 컵받침 세트",
    price: 9000,
    thumbnail: placeholderImageRef(9004),
    artisan: { id: -4, name: "이방직" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
];
