import { z } from "zod";

const positiveId = z.number().int().positive().safe();

/**
 * `GET /api/member/me/wishes` content item — 실제 BE `MemberReadRepositoryImpl#product()`
 * 프로젝션 그대로(2026-09-21 BE 레포 직접 대조로 확인). `ProductSummary`가 실제로 소비하는
 * 슬라이스만 선언하고 나머지(category/material/isLimited 등)는 `.passthrough()`로 흡수한다.
 */
const wishlistProductDto = z
  .object({
    productId: positiveId,
    name: z.string(),
    price: z.number().int().nonnegative(),
    thumbnail: z.array(z.object({ url: z.string() }).passthrough()),
    status: z.string(),
    rating: z.number().nullable(),
    artisanId: positiveId,
    artisanName: z.string().nullable(),
    primaryBadge: z.string().nullable(),
  })
  .passthrough();

/** Spring `Page` 직렬화 그대로 — `api/reviews/validation.ts`와 같은 패턴. */
const springPageEnvelope = {
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  number: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
};

export const wishlistPageDto = z
  .object({
    content: z.array(wishlistProductDto),
    ...springPageEnvelope,
  })
  .passthrough();

export type WishlistProductDto = z.infer<typeof wishlistProductDto>;
export type WishlistPageDto = z.infer<typeof wishlistPageDto>;
