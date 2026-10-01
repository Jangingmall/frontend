import { type DefaultBodyType, http, HttpResponse, type PathParams } from "msw";
import { z } from "zod";

import { isSellerDemoId } from "@/api/seller-demo/scenarios";
import type { SellerContent, SellerProduct } from "@/api/seller-studio/api";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import { editNode, flattenDocument } from "@/utils/seller-studio/document";

import { fixture } from "./document";

type Envelope = ApiResponse<unknown> | ApiErrorResponse;
type RecordData = {
  product: SellerProduct;
  generationId?: number;
  polls: number;
  content?: SellerContent;
};
const generationInput = z.object({
  productName: z.string().trim().min(1).max(15),
  howMade: z.string().trim().min(1).max(2000),
  careTips: z.string().trim().min(1).max(2000),
  images: z.array(z.string()).min(1).max(8),
});
const productInput = z.object({
  title: z.string().trim().min(1).max(15),
  price: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
});
export function createSellerDemoHandlers() {
  const sessions = new Map<string, Map<number, RecordData>>();
  const uploads = new Map<
    string,
    { data: ArrayBuffer | null; owner: string }
  >();
  let nextId = 1;
  return [
    http.all(
      "*/api/mock/seller-demos/:scenario/uploads/:imageId/:variant",
      async ({ request, params }) => {
        const key = new URL(request.url).pathname;
        if (!isSellerDemoId(String(params.scenario)) || !uploads.has(key))
          return new HttpResponse(null, { status: 404 });
        if (request.method === "PUT") {
          const body = await request.arrayBuffer();
          if (body.byteLength > 10 * 1024 * 1024)
            return new HttpResponse(null, { status: 413 });
          uploads.get(key)!.data = body;
          return new HttpResponse(null, { status: 200 });
        }
        const data = uploads.get(key)?.data;
        return request.method === "GET" && data
          ? new HttpResponse(data, {
              headers: { "Content-Type": "image/webp" },
            })
          : new HttpResponse(null, { status: 404 });
      },
    ),
    http.all<PathParams, DefaultBodyType, Envelope>(
      "*/api/mock/seller-demos/:scenario/api/*",
      async ({ request, params }) => {
        const scenario = String(params.scenario);
        if (!isSellerDemoId(scenario)) return mockError(404, "NOT_FOUND");
        const session = request.headers.get("X-Studio-Session");
        if (!session || session.length > 100)
          return mockError(400, "INVALID_REQUEST");
        const key = scenario + ":" + session;
        let records = sessions.get(key);
        if (!records) {
          records = new Map();
          sessions.set(key, records);
        }
        const url = new URL(request.url);
        const path = url.pathname.replace(
          /^\/api\/mock\/seller-demos\/[12]/,
          "",
        );
        const method = request.method;
        const body = ["POST", "PATCH"].includes(method)
          ? await request.json().catch(() => null)
          : null;
        if (path === "/api/images/presigned-url" && method === "POST") {
          const input = z
            .object({
              variants: z
                .array(z.object({ name: z.enum(["320w", "640w", "1280w"]) }))
                .length(3),
            })
            .safeParse(body);
          if (!input.success) return mockError(400, "INVALID_REQUEST");
          const prefix = `/api/mock/seller-demos/${scenario}/uploads/${crypto.randomUUID()}`;
          return mockOk({
            imageId: prefix + "/1280w",
            expiresInSeconds: 300,
            uploads: input.data.variants.map(({ name }) => {
              uploads.set(prefix + "/" + name, { data: null, owner: key });
              return {
                variant: name,
                objectKey: prefix + "/" + name,
                presignedUrl: url.origin + prefix + "/" + name,
              };
            }),
          });
        }
        if (path === "/api/products" && method === "POST") {
          const input = productInput.safeParse(body);
          if (!input.success) return mockError(400, "INVALID_REQUEST");
          const product = {
            ...input.data,
            productId: nextId++,
            status: "DRAFT",
          };
          records.set(product.productId, { product, polls: 0 });
          return mockOk(product, 201);
        }
        const productMatch = path.match(/^\/api\/products\/(\d+)$/);
        if (productMatch && method === "GET") {
          const row = records.get(Number(productMatch[1]));
          return row ? mockOk(row.product) : mockError(404, "NOT_FOUND");
        }
        const match = path.match(/^\/api\/content\/products\/(\d+)(\/.*)$/);
        if (!match) return mockError(404, "NOT_FOUND");
        const row = records.get(Number(match[1]));
        if (!row) return mockError(404, "NOT_FOUND");
        const tail = match[2];
        if (tail === "/generations" && method === "POST") {
          if (!generationInput.safeParse(body).success)
            return mockError(400, "INVALID_REQUEST");
          row.generationId = nextId++;
          row.polls = 0;
          delete row.content;
          return mockOk(
            {
              productId: row.product.productId,
              generationId: row.generationId,
              status: "QUEUED",
            },
            202,
          );
        }
        if (tail === `/generations/${row.generationId}` && method === "GET") {
          row.polls++;
          if (row.polls >= 2 && !row.content)
            row.content = {
              contentId: nextId++,
              productId: row.product.productId,
              status: "DRAFT",
              version: 1,
              reactDocument: fixture(scenario),
            };
          return mockOk({
            productId: row.product.productId,
            generationId: row.generationId,
            status: row.polls >= 2 ? "COMPLETED" : "PROCESSING",
          });
        }
        const content = row.content;
        if (!content) return mockError(404, "NOT_FOUND");
        if (tail === "/contents" && method === "GET") return mockOk(content);
        if (tail === `/contents/${content.contentId}` && method === "PATCH") {
          if (!["DRAFT", "REJECTED"].includes(content.status))
            return mockError(422, "INVALID_STATE");
          const parsed = z
            .object({
              patches: z
                .array(
                  z.object({
                    nodeId: z.string(),
                    text: z.string().max(50000).optional(),
                    imageId: z.string().optional(),
                  }),
                )
                .max(2500),
            })
            .safeParse(body);
          if (!parsed.success) return mockError(400, "INVALID_REQUEST");
          const nodes = flattenDocument(content.reactDocument);
          for (const patch of parsed.data.patches) {
            const node = nodes.find((n) => n.id === patch.nodeId);
            if (
              !node ||
              (patch.text !== undefined && node.type !== "text") ||
              (patch.imageId !== undefined &&
                (node.tag !== "img" ||
                  !(
                    flattenDocument(fixture(scenario)).some(
                      (original) => original.props?.imageId === patch.imageId,
                    ) ||
                    (uploads.get(patch.imageId)?.owner === key &&
                      uploads.get(patch.imageId)?.data)
                  )))
            )
              return mockError(400, "INVALID_REQUEST");
          }
          for (const patch of parsed.data.patches)
            content.reactDocument = editNode(
              content.reactDocument,
              patch.nodeId,
              patch,
            );
          content.version++;
          return mockOk({
            contentId: content.contentId,
            productId: content.productId,
            status: content.status,
            version: content.version,
          });
        }
        const action =
          tail === "/publish"
            ? "publish"
            : tail.startsWith(`/contents/${content.contentId}/`)
              ? tail.split("/").at(-1)
              : undefined;
        if (
          method === "POST" &&
          action &&
          ["submit", "approve", "reject", "publish"].includes(action)
        ) {
          const allowed: Record<string, string[]> = {
            submit: ["DRAFT", "REJECTED"],
            approve: ["PENDING_REVIEW"],
            reject: ["PENDING_REVIEW"],
            publish: ["APPROVED"],
          };
          if (!allowed[action].includes(content.status))
            return mockError(422, "INVALID_STATE");
          if (
            action === "approve" &&
            !z
              .object({
                factCheckConfirmed: z.literal(true),
                photoMatchConfirmed: z.literal(true),
              })
              .safeParse(body).success
          )
            return mockError(400, "INVALID_REQUEST");
          const states = {
            submit: "PENDING_REVIEW",
            approve: "APPROVED",
            reject: "REJECTED",
            publish: "PUBLISHED",
          } as const;
          content.status = states[action as keyof typeof states];
          return mockOk({
            contentId: content.contentId,
            status: content.status,
          });
        }
        return mockError(404, "NOT_FOUND");
      },
    ),
  ];
}
export const sellerDemoHandlers = createSellerDemoHandlers();
