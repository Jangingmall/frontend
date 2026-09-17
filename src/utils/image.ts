import type { ImageRef, ImageVariant, ImageVariantWidth } from "@/types/image";

/**
 * 이미지 variant 선택. 목표 폭과 일치하는 variant를 우선 쓰고, 없으면 첫 variant로
 * 대체한다(로드 실패 시 placeholder로 바꾸는 건 각 컴포넌트의 `hasImageError` 상태가 담당).
 */
export function pickThumbnailVariant(
  thumbnail: ImageRef,
  targetWidth: ImageVariantWidth,
): ImageVariant | undefined {
  return (
    thumbnail.variants.find((variant) => variant.width === targetWidth) ??
    thumbnail.variants[0]
  );
}
