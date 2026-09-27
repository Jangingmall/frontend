import { z } from "zod";

const variantDto = z.object({ url: z.string(), width: z.number().optional() });
export const imageReferenceDto = z.object({
  imageId: z.string(),
  variants: z.array(variantDto),
});
export const thumbnailDto = z
  .union([z.array(variantDto), imageReferenceDto])
  .nullish();
export function imageUrl(
  thumbnail: z.infer<typeof thumbnailDto>,
  legacy?: string | null,
): string | null {
  const variants = Array.isArray(thumbnail) ? thumbnail : thumbnail?.variants;
  return (
    variants?.find((v) => v.width === 640)?.url ??
    variants?.[0]?.url ??
    legacy ??
    null
  );
}

/** 주문 스냅샷에 표시명이 없는 ID를 임의 옵션명으로 만들지 않는다. */
export const optionSnapshotDto = z.union([
  z.array(z.string()),
  z
    .object({
      selectedOptions: z
        .array(
          z.object({
            name: z.string().optional(),
            choiceName: z.string().optional(),
          }),
        )
        .default([]),
      textInputs: z
        .array(z.object({ name: z.string().optional(), text: z.string() }))
        .default([]),
    })
    .transform((value) => [
      ...value.selectedOptions.flatMap((option) =>
        option.choiceName
          ? [
              option.name
                ? `${option.name}: ${option.choiceName}`
                : option.choiceName,
            ]
          : [],
      ),
      ...value.textInputs.map((option) =>
        option.name ? `${option.name}: ${option.text}` : option.text,
      ),
    ]),
]);
export const reviewImageDto = z.union([
  z.object({ src: z.string(), alt: z.string() }),
  imageReferenceDto,
  z.object({ legacyImageUrl: z.string() }),
]);
export function reviewImage(
  image: z.infer<typeof reviewImageDto>,
  index: number,
) {
  if ("src" in image) return { src: image.src, alt: image.alt };
  const src =
    "legacyImageUrl" in image ? image.legacyImageUrl : imageUrl(image);
  return src ? { src, alt: `후기 사진 ${index + 1}` } : null;
}
