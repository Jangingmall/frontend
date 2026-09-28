import { publicEnv } from "@/lib/env";

export async function register() {
  if (publicEnv.isVercelProduction && publicEnv.apiMocking) return;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startRuntimeServer } = await import("@/mocks/server");
    await startRuntimeServer(publicEnv.apiMocking ? "msw" : "api");
  }
}
