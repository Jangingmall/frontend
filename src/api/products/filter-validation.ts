import { z } from "zod";

// TODO BE 응답 확정 시 대조한다. 경로만 공개조회 계약에 있고 응답 형태는 미정이다.
export const productCategoriesDto = z.array(
  z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      parentId: z.string().nullable(),
      minPrice: z.number().int().nonnegative(),
      maxPrice: z.number().int().nonnegative(),
    })
    .refine((category) => category.maxPrice >= category.minPrice),
);

export const productMaterialsDto = z.array(
  z.object({ id: z.string(), name: z.string() }),
);

// MSW 종목 fixture용. 구조는 기존 BE 품목 DTO와 같지만 공예 종목의 운영 계약이 아니다.
export const productCraftsDto = z.array(
  z.object({
    subcategoryId: z.number().int().positive(),
    categoryId: z.number().int().positive(),
    name: z.string().min(1),
  }),
);

export type ProductCategoriesDto = z.infer<typeof productCategoriesDto>;
export type ProductMaterialsDto = z.infer<typeof productMaterialsDto>;
export type ProductCraftsDto = z.infer<typeof productCraftsDto>;
