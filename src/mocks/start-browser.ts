import { publicEnv } from "@/lib/env";

let startPromise: Promise<void> | null = null;

/** API 모드에서는 허용한 미지원 화면의 시연 요청만 가로챈다. */
export function startMockWorker(): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  if (publicEnv.apiMocking && publicEnv.isVercelProduction) {
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
