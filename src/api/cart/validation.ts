import { z } from "zod";
const money = z.number().int().nonnegative();
const cartItemDto = z
  .object({
    cartItemId: z.number().int().positive(),
    productId: z.number().int().positive(),
    productName: z.string(),
    unitPrice: money,
    quantity: z.number().int().positive(),
    subtotal: money,
    thumbnail: z.array(
      z
        .object({
          url: z.string(),
          width: z.number(),
          height: z.number(),
          format: z.string(),
        })
        .passthrough(),
    ),
    isCustomOrder: z.boolean(),
    soldOut: z.boolean(),
    selected: z.boolean(),
    selectedOptions: z.array(
      z
        .object({
          optionGroupId: z.number().int().positive(),
          choiceId: z.number().int().positive(),
          name: z.string(),
          choiceName: z.string(),
        })
        .passthrough(),
    ),
    textInputs: z.array(
      z
        .object({
          optionGroupId: z.number().int().positive(),
          name: z.string(),
          text: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough();
export const cartDto = z
  .object({
    sections: z.array(
      z
        .object({
          artisanId: z.number().int(),
          artisanName: z.string(),
          shippingFee: money,
          freeShippingThreshold: money.nullable(),
          items: z.array(cartItemDto),
        })
        .passthrough(),
    ),
    totalPrice: money,
    totalShippingFee: money,
    totalCount: z.number().int().nonnegative(),
  })
  .passthrough();
export type CartDto = z.infer<typeof cartDto>;
