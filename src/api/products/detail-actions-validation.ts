import { z } from "zod";

/** `fetchProductActionState`가 최종적으로 돌려주는 합성 결과(찜 + 재입고 알림) 모양. */
export const productActionStateDto = z
  .object({ wished: z.boolean(), restockRequested: z.boolean() })
  .passthrough();
/**
 * 재입고 알림 데모 전용 GET(`/detail-actions`) 응답 — 찜은 더 이상 이 엔드포인트가 안 담당해
 * `restockRequested`만 온다(`api/products/mock/detail-action-handlers.ts`).
 */
export const restockDemoStateDto = z
  .object({ restockRequested: z.boolean() })
  .passthrough();
export const productActionResultDto = z
  .object({ duplicate: z.boolean() })
  .passthrough();
export const productCartInput = z.object({
  lines: z
    .array(
      z.object({
        choices: z.record(z.string(), z.string()),
        quantity: z.number().int().min(1).max(10000),
      }),
    )
    .min(1)
    .max(100),
});
export type ProductCartLine = z.infer<typeof productCartInput>["lines"][number];
export type ProductActionState = z.infer<typeof productActionStateDto>;

const positiveId = z.number().int().positive().safe();
export const backendCartInput = z.object({
  productId: positiveId,
  quantity: z.number().int().min(1).max(10000),
  selectedOptions: z.array(
    z.object({ optionGroupId: positiveId, choiceId: positiveId }),
  ),
  textInputs: z.array(
    z.object({ optionGroupId: positiveId, text: z.string().min(1).max(500) }),
  ),
});
export const backendCartDto = z.object({
  sections: z.array(
    z.object({
      artisanId: positiveId,
      items: z.array(
        z.object({
          cartItemId: positiveId,
          productId: positiveId,
          quantity: z.number().int().positive(),
        }),
      ),
    }),
  ),
  totalPrice: z.number().int().nonnegative(),
  totalShippingFee: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});
