import { z } from "zod";

const positiveId = z.number().int().positive().safe();

/**
 * `GET /api/member/recent-views` content item — 실제 BE
 * `MemberReadRepositoryImpl#recentViews()`가 `product()` 프로젝션에 `viewedAt`을 더해
 * 내려준다(2026-09-21 BE 레포 직접 대조로 확인). `viewedAt`은 BE가 이미
 * `viewedAt DESC, id DESC`로 정렬해 주므로 FE 모델(`mapper.ts`)은 정렬용으로만 검증하고
 * 화면엔 안 싣는다.
 */
const recentViewProductDto = z
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
    viewedAt: z.string(),
  })
  .passthrough();

/** Spring `Page` 직렬화 그대로 — `api/wishlist/validation.ts`와 같은 패턴. */
const springPageEnvelope = {
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  number: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
  empty: z.boolean(),
};

export const recentViewPageDto = z
  .object({
    content: z.array(recentViewProductDto),
    ...springPageEnvelope,
  })
  .passthrough();

export type RecentViewProductDto = z.infer<typeof recentViewProductDto>;
export type RecentViewPageDto = z.infer<typeof recentViewPageDto>;
