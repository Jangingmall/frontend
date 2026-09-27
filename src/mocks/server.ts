import { getResponse } from "msw";
import { setupServer } from "msw/node";

import { setServerMockResolver } from "@/lib/http/server-mock";

import { handlers } from "./handlers";

export const server = setupServer(...handlers);

export async function startRuntimeServer(mode: "msw" | "api") {
  const { createRuntimeHandlers } = await import("./runtime-handlers");
  if (mode === "api") {
    const runtimeHandlers = createRuntimeHandlers(mode);
    setServerMockResolver(async (request) => {
      if (!new URL(request.url).pathname.startsWith("/api/mock/"))
        return undefined;
      return getResponse(runtimeHandlers, request);
    });
    return;
  }
  const runtimeServer = setupServer(...createRuntimeHandlers(mode));
  runtimeServer.listen({ onUnhandledRequest: "bypass" });
}
