import { z } from "zod";
export const previewLinesSchema = z.array(
  z.object({
    lineId: z.string(),
    productId: z.number().int().positive(),
    artisanId: z.number(),
    artisanName: z.string(),
    productName: z.string(),
    thumbnail: z.object({
      imageId: z.string(),
      variants: z.array(
        z.object({
          width: z.union([z.literal(320), z.literal(640), z.literal(1280)]),
          url: z.string(),
          format: z.literal("webp"),
        }),
      ),
    }),
    options: z.array(z.string()),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    maxQuantity: z.number().int().nonnegative(),
    soldOut: z.boolean(),
    selected: z.boolean(),
    productPath: z.string().optional(),
    note: z.string().optional(),
  }),
);
