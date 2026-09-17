import { z } from "zod";

import { productDetailDto } from "./detail-validation";
const natural = z.number().int().nonnegative().safe();
export const backendProductListDto = z.object({
  content: z.array(
    productDetailDto.extend({
      status: z.literal("ON_SALE"),
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
