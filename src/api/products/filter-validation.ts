import { z } from "zod";

// FE/MSW 잠정 모델이다. Notion의 { code, name, productCount } 응답과 다르다.
// TODO #48: PD 분류 반영 후 실제 DTO를 검증·변환한다. 이 모델에 맞춘 BE 필드
// 추가를 요구하지 않으며, GNB의 분류 정의와 진입 URL은 그대로 사용한다.
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

// TODO #48: Notion의 { code, name }과 현재 FE/MSW의 { id, name } 차이는
// BE 응답 확인 후 이 스키마와 mapper에서 처리한다.
export const productMaterialsDto = z.array(
  z.object({ id: z.string(), name: z.string() }),
);

// PR #45에서 확인한 BE develop CategoryResponse.SubcategoryItem 기준이다.
// TODO #48: Notion은 { code, name }을 명시한다. PD 분류별 선택지 계약이 반영된
// 실제 응답을 대조하기 전까지 이 숫자 ID 스키마를 최종 계약으로 취급하지 않는다.
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
