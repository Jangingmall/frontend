import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_BASE_URL: z.string().url().optional().or(z.literal("")),
  REVALIDATE_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional().or(z.literal("")),
  // "enabled"이면 MSW 목업으로 동작(백엔드 불필요). 비어 있으면 실제 백엔드.
  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled"]).optional().or(z.literal("")),
});

export function validateEnvironment(environment: NodeJS.ProcessEnv) {
  const parsed = schema.parse(environment);
  if (
    parsed.NODE_ENV === "production" &&
    (!parsed.API_BASE_URL || !parsed.REVALIDATE_WEBHOOK_SECRET)
  ) {
    throw new Error(
      "Production requires API_BASE_URL and REVALIDATE_WEBHOOK_SECRET.",
    );
  }
  return {
    server: {
      apiBaseUrl: parsed.API_BASE_URL,
      revalidateWebhookSecret: parsed.REVALIDATE_WEBHOOK_SECRET,
    },
    public: { tossClientKey: parsed.NEXT_PUBLIC_TOSS_CLIENT_KEY },
  };
}

/**
 * 런타임 공개 env. `NEXT_PUBLIC_*`만 담아 클라이언트 번들에서도 안전하게 읽는다.
 * 모듈 로드 시 스키마 parse를 하지 않는다(throw 없음) — 형식 검증은
 * {@link validateEnvironment}(배포 전 러너)가 담당하고, 여기서는 얇은 접근자만 둔다.
 * (docs/data-layer.md §9 — `process.env` 산발 읽기 대체)
 */
export const publicEnv = {
  apiMocking: process.env.NEXT_PUBLIC_API_MOCKING === "enabled",
  tossClientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
} as const;
