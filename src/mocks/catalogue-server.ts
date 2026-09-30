import "server-only";

import { getResponse } from "msw";

import { isDemoFeatureRequest } from "@/lib/data-mode";
import { resolveResponse } from "@/lib/http/response";

import { createRuntimeHandlers } from "./runtime-handlers";

const handlers = createRuntimeHandlers("api");
/** 정적 빌드에서도 instrumentation이나 네트워크 요청 없이 공개 시연 카탈로그를 읽는다. */
export async function readDemoCatalogue(path: string): Promise<unknown> {
  if (!path.startsWith("/api/mock/catalogue/") || !isDemoFeatureRequest(path))
    throw new Error("시연 카탈로그 조회만 허용됩니다.");
  const response = await getResponse(
    handlers,
    new Request(new URL(path, "http://msw.local")),
  );
  if (!response) throw new Error("시연 카탈로그 응답이 없습니다.");
  return resolveResponse(response);
}
