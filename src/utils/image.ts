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

/**
 * 파일의 실제 픽셀 크기를 읽는다 — presigned URL 업로드 요청(`sourceWidth`/`sourceHeight`)에
 * 필요하다(`api/images/api.ts`). `URL.createObjectURL`은 사용 즉시 해제한다(메모리 누수 방지).
 */
export function readImageDimensions(
  file: File | Blob,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 크기를 읽을 수 없습니다."));
    };
    image.src = url;
  });
}
