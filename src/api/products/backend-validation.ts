import { z } from "zod";

import { productDetailDto } from "./detail-validation";
const natural = z.number().int().nonnegative().safe();
export const backendProductListDto = z.object({
  content: z.array(
    productDetailDto.extend({
      // 잘못된 썸네일은 기본 이미지로 표시하고 상품 목록은 유지한다.
      thumbnailUrl: productDetailDto.shape.thumbnailUrl.catch(null),
      status: z.enum(["ON_SALE", "SOLD_OUT"]),
      categoryId: natural.positive().nullable(),
      categoryName: z.string().nullable(),
      subcategoryId: natural.positive().nullable(),
      subcategoryName: z.string().nullable(),
      createdAt: z.string().min(1),
      updatedAt: z.string().min(1),
      giftThemes: z.array(z.string()),
      purposeTags: z.array(z.string()),
      productionPeriodDays: natural.nullable(),
      colors: z.array(z.string()),
    }),
  ),
  number: natural,
  size: natural.positive(),
  totalElements: natural,
  totalPages: natural,
});
export const backendCategoriesDto = z.array(
  z.object({ categoryId: natural.positive(), name: z.string().trim().min(1) }),
);
export const backendSubcategoriesDto = z.array(
  z.object({
    subcategoryId: natural.positive(),
    categoryId: natural.positive(),
    name: z.string().trim().min(1),
  }),
);
