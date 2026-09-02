import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_BASE_URL: z.string().url().optional().or(z.literal("")),
  REVALIDATE_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional().or(z.literal("")),
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
