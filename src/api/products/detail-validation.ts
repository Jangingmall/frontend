import { z } from "zod";

import { productListResponseDto } from "./validation";

const natural = z.number().int().nonnegative().safe();
const imageSource = z.string().refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"))
    return true;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, "지원하지 않는 이미지 주소입니다.");
const image = z.object({ src: imageSource, alt: z.string() });
const backendImageVariant = z.object({
  url: imageSource,
  width: natural.positive(),
  height: natural.positive(),
  format: z.string(),
});
const informationRow = z.object({
  label: z.string(),
  content: z.string(),
  details: z
    .array(z.object({ label: z.string(), content: z.string() }).passthrough())
    .optional(),
});

/** 현재 BE ProductResponse의 실제 필드. 확장된 FE 계약과 혼합하지 않는다. */
export const productDetailDto = z.object({
  productId: natural.positive(),
  artisanId: natural.positive(),
  title: z.string().trim().min(1),
  description: z.string().nullish(),
  price: natural,
  stock: natural.nullish(),
  productionPeriodDays: natural.nullish(),
  thumbnailUrl: imageSource.nullish().or(z.literal("")),
  status: z.enum(["ON_SALE", "SOLD_OUT", "DRAFT", "HIDDEN"]),
  images: z
    .array(
      z.object({
        imageId: z.string(),
        alt: z.string().nullish(),
        variants: z.array(backendImageVariant).nullish(),
      }),
    )
    .optional(),
  thumbnail: z.array(backendImageVariant).optional(),
  detailPageBlocks: z
    .array(
      z.object({
        order: natural,
        tag: z.string(),
        hasImage: z.boolean(),
        imageVariants: z.array(backendImageVariant).nullish(),
        text: z.string().nullish(),
        videoUrl: z.string().nullish(),
      }),
    )
    .optional(),
});

/** MSW 전용 확장. 실서버 응답에는 아직 없는 PD-1 데이터를 검증한다. */
export const productDetailMockDto = productDetailDto.extend({
  detail: z.object({
    images: z.array(image).max(6),
    artisan: z
      .object({
        id: natural.positive(),
        name: z.string(),
        image: image.nullable(),
        stage: z.string(),
        craft: z.string(),
        introduction: z.string(),
        href: z.string().startsWith("/artisans/").nullable(),
      })
      .nullable(),
    rating: z.number().min(0).max(5).nullable(),
    reviewCount: natural,
    shipping: z
      .object({
        fee: natural.nullable(),
        freeAbove: natural.nullable(),
        productionDays: z.string().nullable(),
      })
      .nullable(),
    optionGroups: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          required: z.boolean(),
          kind: z.enum(["STANDARD", "GIFT"]),
          values: z.array(
            z.object({
              id: z.string(),
              label: z.string(),
              priceDelta: natural,
              stock: natural.nullable(),
            }),
          ),
        }),
      )
      .max(4),
    variants: z
      .array(
        z.object({
          id: z.string(),
          valueIds: z.array(z.string()),
          stock: natural,
          priceDelta: natural,
        }),
      )
      .nullable(),
    content: z.array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("heading"), text: z.string() }),
        z.object({ type: z.literal("paragraph"), text: z.string() }),
        z.object({ type: z.literal("image"), image }),
      ]),
    ),
    specifications: z.array(informationRow),
    notices: z.array(informationRow),
    shippingInformation: z.array(informationRow),
    relatedProducts: productListResponseDto.shape.items,
  }),
});

export type ProductDetailDto = z.infer<typeof productDetailDto>;
export type ProductDetailMockDto = z.infer<typeof productDetailMockDto>;

export const productArtisanDto = z.object({
  artisanId: natural.positive(),
  businessName: z.string().trim().min(1),
  introduction: z.string().nullish(),
  profileImageUrl: imageSource.nullish().or(z.literal("")),
  category: z.string().nullish(),
});
