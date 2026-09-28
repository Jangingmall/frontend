import { publicEnv } from "@/lib/env";

let startPromise: Promise<void> | null = null;

/** Shared single-flight startup. API mode mocks only explicitly namespaced demo requests.
 * Full MSW authentication remains disabled on Vercel production deployments.
 */
export function startMockWorker(): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  if (publicEnv.apiMocking && publicEnv.isVercelProduction) {
    return Promise.resolve();
  }
  startPromise ??= (async () => {
    const { worker } = await import("./browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  })().catch((error: unknown) => {
    startPromise = null;
    throw error;
  });
  return startPromise;
}
