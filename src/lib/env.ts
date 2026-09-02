import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional().or(z.literal("")),
  REVALIDATE_SECRET: z.string().optional().or(z.literal("")),
});

export function validateEnvironment(environment: NodeJS.ProcessEnv) {
  const parsed = schema.parse(environment);
  if (
    parsed.NODE_ENV === "production" &&
    (!parsed.NEXT_PUBLIC_API_BASE_URL ||
      !parsed.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
      !parsed.REVALIDATE_SECRET)
  ) {
    throw new Error("Production requires all integration variables.");
  }
  return parsed;
}
