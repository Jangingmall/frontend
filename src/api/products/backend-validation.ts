import { z } from "zod";

import { productDetailDto } from "./detail-validation";

const natural = z.number().int().nonnegative().safe();

/** BE ProductResponse / Spring Page 기준. 페이지 응답을 MSW의 items 형식으로 추측하지 않는다. */
export const backendProductListDto = z.object({
  content: z.array(
    productDetailDto.extend({
      status: z.enum(["ON_SALE", "SOLD_OUT"]),
      // TODO BE 목록 메타데이터 제공 여부 확인. 미제공 값은 카드에서 생략한다.
      artisanName: z.string().trim().min(1).nullish(),
      rating: z.number().min(0).max(5).nullish(),
      reviewCount: natural.nullish(),
      primaryBadge: z.string().nullish(),
      colors: z.array(z.string()).nullish(),
    }),
  ),
  number: natural,
  size: natural.positive(),
  totalElements: natural,
  totalPages: natural,
});

/** Notion의 code/name 선택지. 품목 ID 응답을 공예 종목 응답으로 재해석하지 않는다. */
export const backendOptionsDto = z.array(
  z.object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
);

// 기존 숫자 categoryId도 수용하되 PD 이름과 일치하는지 mapper에서 별도로 확인한다.
export const backendCategoriesDto = z.union([
  backendOptionsDto,
  z
    .array(
      z.object({
        categoryId: natural.positive(),
        name: z.string().trim().min(1),
      }),
    )
    .transform((items) =>
      items.map((item) => ({ code: String(item.categoryId), name: item.name })),
    ),
]);

// 기존 BE는 소재 이름의 배열을 반환한다. code 필드 추가를 강제하지 않는다.
export const backendMaterialsDto = z.union([
  backendOptionsDto,
  z
    .array(z.string().trim().min(1))
    .transform((items) => items.map((name) => ({ code: name, name }))),
]);
