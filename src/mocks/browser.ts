import { setupWorker } from "msw/browser";

import { publicEnv } from "@/lib/env";

import { createRuntimeHandlers } from "./runtime-handlers";
export const worker = setupWorker(
  ...createRuntimeHandlers(
    publicEnv.apiMocking ? "msw" : "api",
    window.location.origin,
  ),
);
