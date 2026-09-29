import { setupServer } from "msw/node";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);

export async function startRuntimeServer(mode: "msw" | "api") {
  const { createRuntimeHandlers } = await import("./runtime-handlers");
  if (mode === "api") return;
  const runtimeServer = setupServer(...createRuntimeHandlers(mode));
  runtimeServer.listen({ onUnhandledRequest: "bypass" });
}
