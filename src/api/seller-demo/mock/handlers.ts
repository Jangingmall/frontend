import { type DefaultBodyType, http, type PathParams } from "msw";
import { z } from "zod";

import { isSellerDemoId, type SellerDemoId } from "@/api/seller-demo/scenarios";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import {
  parseDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import first from "./fixtures/1.json";
import second from "./fixtures/2.json";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  making: z.string().trim().min(1).max(2000),
  care: z.string().trim().min(1).max(2000),
  images: z.array(z.string().max(200)).min(1).max(8),
});
const photoPaths: Record<SellerDemoId, Record<string, string>> = {
  "1": {
    hero: "hero.webp",
    detail: "detail.webp",
    lifestyle: "lifestyle.webp",
  },
  "2": {
    hero: "photos/01-hero.png",
    packshot: "photos/02-packshot.png",
    detail: "photos/03-detail.png",
    lifestyle: "photos/04-lifestyle.png",
    "lifestyle-02": "photos/05-lifestyle-02.png",
    "detail-02": "photos/06-detail-02.png",
    "detail-03": "photos/07-detail-03.png",
    "detail-04": "photos/08-detail-04.png",
    "detail-05": "photos/09-detail-05.png",
  },
};
function fixture(id: SellerDemoId) {
  const document = parseDocument(id === "1" ? first : second);
  const visit = (nodes: StudioDocument["root"]) =>
    nodes.forEach((node) => {
      if (node.tag === "img" && node.props?.imageId) {
        const path = photoPaths[id][node.props.imageId];
        if (!path) throw new Error("시연 사진이 없습니다.");
        node.props.src = "/seller-demos/" + id + "/" + path;
        node.props.imageId = node.props.src;
      }
      if (node.children) visit(node.children);
    });
  visit(document.root);
  return document;
}
export function createSellerDemoHandlers() {
  const records = new Map<
    string,
    { document: StudioDocument; version: number }
  >();
  return [
    http.all<
      PathParams,
      DefaultBodyType,
      ApiResponse<unknown> | ApiErrorResponse
    >("*/api/mock/seller-demos/:scenario", async ({ request, params }) => {
      const id = String(params.scenario);
      if (!isSellerDemoId(id)) return mockError(404, "NOT_FOUND");
      const session = request.headers.get("X-Studio-Session");
      if (!session || session.length > 100)
        return mockError(400, "INVALID_REQUEST");
      const key = id + ":" + session;
      if (request.method === "GET") {
        const row = records.get(key);
        return row ? mockOk(row) : mockError(404, "NOT_FOUND");
      }
      if (request.method === "POST") {
        const input = inputSchema.safeParse(
          await request.json().catch(() => null),
        );
        if (!input.success) return mockError(400, "INVALID_REQUEST");
        const row = { document: fixture(id), version: 1 };
        records.set(key, row);
        return mockOk(row);
      }
      if (request.method === "PUT") {
        if (!records.has(key)) return mockError(404, "NOT_FOUND");
        try {
          const body = (await request.json()) as { document: unknown };
          const document = parseDocument(body.document);
          const row = { document, version: records.get(key)!.version + 1 };
          records.set(key, row);
          return mockOk(row);
        } catch {
          return mockError(400, "INVALID_REQUEST");
        }
      }
      return mockError(405, "METHOD_NOT_ALLOWED");
    }),
  ];
}
export const sellerDemoHandlers = createSellerDemoHandlers();
