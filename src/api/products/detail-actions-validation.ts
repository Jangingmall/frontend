import { z } from "zod";

export const productActionStateDto = z
  .object({ wished: z.boolean(), restockRequested: z.boolean() })
  .passthrough();
export const productActionResultDto = z
  .object({ duplicate: z.boolean() })
  .passthrough();
export const productWishlistInput = z.object({ wished: z.boolean() });
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
