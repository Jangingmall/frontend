import { z } from "zod";

export const homeProductSummarySchema = z.object({
  id: z.number().int(),
  isDemo: z.boolean().optional(),
  name: z.string(),
  price: z.number().nonnegative(),
  thumbnail: z.null(),
  thumbnailUrl: z.string().min(1),
  artisan: z.object({ id: z.number().int(), name: z.string().nullable() }),
  craftCategory: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative().nullable(),
  primaryBadge: z.string().nullable(),
  isSoldOut: z.boolean(),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
});
