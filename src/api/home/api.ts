import { z } from "zod";

import { publicEnv } from "@/lib/env";
import { fetchPublicApi } from "@/lib/http/fetcher";
const read = (path: string) =>
  fetchPublicApi(path, { tags: ["home"], revalidate: 300 });
export const carouselItem = z.object({
  id: z.string(),
  badge: z.string(),
  headline: z.string(),
  description: z.string(),
  experience: z.string(),
  artworkCount: z.string(),
  workshop: z.string(),
  certificationTitle: z.string().optional(),
});
export async function fetchHomeArtisans() {
  if (publicEnv.apiMocking)
    return z.array(carouselItem).parse(await read("/api/mock/home/artisans"));
  const dto = z
    .object({
      content: z.array(
        z.object({
          artisanId: z.number().int().positive(),
          businessName: z.string(),
          introduction: z.string().nullable(),
          certificationLevel: z.string().nullable(),
          careerYears: z.number().nullable(),
          productCount: z.number().nonnegative(),
          region: z.string().nullable(),
          quote: z.string().nullable().optional(),
        }),
      ),
    })
    .parse(await read("/api/member/artisans?page=0&size=6&sort=POPULAR"));
  return dto.content.map((item) => ({
    id: String(item.artisanId),
    badge: item.certificationLevel ?? "정보 미제공",
    certificationTitle: "장인",
    headline: item.quote || item.businessName,
    description: item.introduction ?? "",
    experience: item.careerYears === null ? "미제공" : `${item.careerYears}년`,
    artworkCount: `총 ${item.productCount}점`,
    workshop: item.region ?? "미제공",
  }));
}
