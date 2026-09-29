import { publicEnv } from "@/lib/env";

let startPromise: Promise<void> | null = null;

/** 명시적인 MSW 개발 모드에서만 워커를 시작한다. */
export function startMockWorker(): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  if (!publicEnv.apiMocking || publicEnv.isVercelProduction) {
    startPromise ??= (async () => {
      if (!("serviceWorker" in navigator)) return;
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => {
          const worker =
            registration.active ??
            registration.waiting ??
            registration.installing;
          if (
            worker &&
            new URL(worker.scriptURL).pathname === "/mockServiceWorker.js"
          )
            return registration.unregister();
        }),
      );
    })().catch(() => {
      startPromise = null;
    });
    return startPromise;
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
