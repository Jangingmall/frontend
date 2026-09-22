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
  NEXT_PUBLIC_ALLOW_PRODUCTION_MOCK: z
    .enum(["enabled"])
    .optional()
    .or(z.literal("")),
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
  /** 공유 테스트 배포에서만 명시적으로 활성화한다. MSW 자체를 켜지는 않는다. */
  allowProductionMock:
    process.env.NEXT_PUBLIC_ALLOW_PRODUCTION_MOCK === "enabled",
  tossClientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "",
  /**
   * Vercel이 실제 production 배포에서만 자동으로 심어주는 값이다 — `NODE_ENV`와 달리
   * "최적화된 빌드 모드"가 아니라 "어디에 떠 있는가"를 가리킨다. CI(`npm run build &&
   * npm run start`)나 로컬 production 빌드는 `NODE_ENV`는 `"production"`이어도
   * `VERCEL_ENV`는 비어 있다 — 그래서 목업을 production 배포에서만 막을 때는
   * `NODE_ENV`가 아니라 이 값을 써야 한다(PR 리뷰 — CI E2E가 `NODE_ENV` 기준 차단에
   * 걸려 전부 실패했던 사고). 서버·클라이언트 어디서나 같은 값을 보도록
   * `NEXT_PUBLIC_VERCEL_ENV`(Vercel이 자동으로 클라이언트에도 노출하는 값)로 통일한다.
   */
  isVercelProduction: process.env.NEXT_PUBLIC_VERCEL_ENV === "production",
} as const;
