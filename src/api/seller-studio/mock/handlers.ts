import { type DefaultBodyType, http, type PathParams } from "msw";

import type { ApiErrorResponse, ApiResponse } from "@/types/api";
type Envelope = ApiResponse<unknown> | ApiErrorResponse;

import type {
  GenerationInput,
  SellerContent,
  SellerProduct,
} from "@/api/seller-studio/api";
import { mockError, mockOk } from "@/mocks/envelope";
import {
  editNode,
  type NodePatch,
  parseDocument,
} from "@/utils/seller-studio/document";

type RecordData = {
  product: SellerProduct;
  content?: SellerContent;
  generationId?: number;
  polls?: number;
  input?: GenerationInput;
};
const key = "midam:mock-seller-api";
function read(): Record<string, RecordData> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as Record<
      string,
      RecordData
    >;
  } catch {
    return {};
  }
}
function write(data: Record<string, RecordData>) {
  localStorage.setItem(key, JSON.stringify(data));
}
const prefix = "*/api/content/products/:productId";
export const sellerHandlers = [
  http.get<PathParams, DefaultBodyType, Envelope>(
    "*/api/products/me",
    ({ request }) => {
      const data = Object.values(read()).map((row) => row.product);
      const page = Number(new URL(request.url).searchParams.get("page") ?? 0);
      return mockOk({
        content: data.slice(page * 20, (page + 1) * 20),
        totalElements: data.length,
        totalPages: Math.ceil(data.length / 20),
      });
    },
  ),
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/products",
    async ({ request }) => {
      const input = (await request.json()) as {
        title: string;
        price: number;
        stock: number;
      };
      const data = read();
      const productId = Date.now();
      const product = { productId, ...input, status: "DRAFT" };
      data[productId] = { product };
      write(data);
      return mockOk(product, 201);
    },
  ),
  http.post<PathParams, DefaultBodyType, Envelope>(
    prefix + "/generations",
    async ({ request, params }) => {
      const data = read(),
        row = data[String(params.productId)];
      if (!row) return mockError(404, "NOT_FOUND");
      row.input = (await request.json()) as GenerationInput;
      row.generationId = Date.now();
      row.polls = 0;
      delete row.content;
      write(data);
      return mockOk(
        {
          productId: row.product.productId,
          generationId: row.generationId,
          status: "QUEUED",
        },
        202,
      );
    },
  ),
  http.get<PathParams, DefaultBodyType, Envelope>(
    prefix + "/generations/:generationId",
    ({ params }) => {
      const data = read(),
        row = data[String(params.productId)];
      if (!row || row.generationId !== Number(params.generationId))
        return mockError(404, "NOT_FOUND");
      row.polls = (row.polls ?? 0) + 1;
      if (row.polls >= 2 && !row.content) {
        row.content = {
          contentId: row.product.productId,
          productId: row.product.productId,
          status: "DRAFT",
          version: 1,
          reactDocument: parseDocument({
            schemaVersion: "2.0",
            canvasWidth: 774,
            root: [
              {
                id: "heading",
                type: "element",
                tag: "h2",
                children: [
                  {
                    id: "title",
                    type: "text",
                    value: row.input?.productName ?? row.product.title,
                  },
                ],
              },
              {
                id: "description",
                type: "element",
                tag: "p",
                children: [
                  {
                    id: "howMade",
                    type: "text",
                    value: row.input?.howMade ?? "",
                  },
                ],
              },
              {
                id: "care",
                type: "element",
                tag: "p",
                children: [
                  {
                    id: "careTips",
                    type: "text",
                    value: row.input?.careTips ?? "",
                  },
                ],
              },
              {
                id: "photo",
                type: "element",
                tag: "img",
                props: {
                  src: "/studio/asset-1.png",
                  imageId: row.input?.images[0],
                },
                children: [],
              },
            ],
          }),
        };
      }
      write(data);
      return mockOk({
        productId: row.product.productId,
        generationId: row.generationId,
        status: row.polls >= 2 ? "COMPLETED" : "PROCESSING",
      });
    },
  ),
  http.get<PathParams, DefaultBodyType, Envelope>(
    prefix + "/contents",
    ({ params }) => {
      const row = read()[String(params.productId)];
      return row?.content ? mockOk(row.content) : mockError(404, "NOT_FOUND");
    },
  ),
  http.patch<PathParams, DefaultBodyType, Envelope>(
    prefix + "/contents/:contentId",
    async ({ params, request }) => {
      const data = read(),
        row = data[String(params.productId)];
      if (!row?.content) return mockError(404, "NOT_FOUND");
      if (!["DRAFT", "REJECTED"].includes(row.content.status))
        return mockError(422, "INVALID_STATE");
      const body = (await request.json()) as { patches: NodePatch[] };
      for (const patch of body.patches)
        row.content.reactDocument = editNode(
          row.content.reactDocument,
          patch.nodeId,
          patch,
        );
      row.content.version++;
      write(data);
      return mockOk({
        contentId: row.content.contentId,
        productId: row.content.productId,
        status: row.content.status,
        version: row.content.version,
      });
    },
  ),
  ...(["submit", "approve", "reject", "publish"] as const).map((action) =>
    http.post<PathParams, DefaultBodyType, Envelope>(
      action === "publish"
        ? prefix + "/publish"
        : prefix + "/contents/:contentId/" + action,
      async ({ params, request }) => {
        const data = read(),
          row = data[String(params.productId)];
        if (!row?.content) return mockError(404, "NOT_FOUND");
        const allowed = {
          submit: ["DRAFT", "REJECTED"],
          approve: ["PENDING_REVIEW"],
          reject: ["PENDING_REVIEW"],
          publish: ["APPROVED"],
        };
        if (!allowed[action].includes(row.content.status))
          return mockError(422, "INVALID_STATE");
        if (action === "approve") {
          const body = (await request.json()) as {
            factCheckConfirmed: boolean;
            photoMatchConfirmed: boolean;
          };
          if (!body.factCheckConfirmed || !body.photoMatchConfirmed)
            return mockError(400, "INVALID_INPUT");
        }
        row.content.status = (
          {
            submit: "PENDING_REVIEW",
            approve: "APPROVED",
            reject: "REJECTED",
            publish: "PUBLISHED",
          } as const
        )[action];
        write(data);
        return mockOk({
          contentId: row.content.contentId,
          status: row.content.status,
        });
      },
    ),
  ),
];
