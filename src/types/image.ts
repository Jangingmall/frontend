/**
 * 이미지 참조. (docs/api-contract.md §2.2)
 * `imageId`(ULID) + variant 배열. variant는 320w / 640w / 1280w 고정 3종, `webp`.
 */

export type ImageVariantWidth = 320 | 640 | 1280;

export interface ImageVariant {
  width: ImageVariantWidth;
  url: string;
  format: "webp";
}

export interface ImageRef {
  /** ULID (예: `image_01HXYZ`). 숫자 ID 규칙의 예외. */
  imageId: string;
  variants: ImageVariant[];
}
