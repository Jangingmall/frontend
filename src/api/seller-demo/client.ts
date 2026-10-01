import { z } from "zod";

import { clientFetch } from "@/lib/http/client";
import { startMockWorker } from "@/mocks/start-browser";
import {
  parseDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import type { SellerDemoId } from "./scenarios";
const result = z.object({
  document: z.unknown().transform(parseDocument),
  version: z.number().int().positive(),
});
export async function requestSellerDemo(
  id: SellerDemoId,
  session: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
) {
  await startMockWorker();
  return result.parse(
    await clientFetch("/api/mock/seller-demos/" + id, {
      method,
      body,
      auth: false,
      headers: { "X-Studio-Session": session },
    }),
  );
}
export function saveSellerDemo(
  id: SellerDemoId,
  session: string,
  document: StudioDocument,
) {
  return requestSellerDemo(id, session, "PUT", { document });
}
