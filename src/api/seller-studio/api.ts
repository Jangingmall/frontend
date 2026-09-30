import { z } from "zod";

import { clientFetch } from "@/lib/http/client";
import { type NodePatch, parseDocument } from "@/utils/seller-studio/document";

export const productSchema = z.object({
  productId: z.number().int().positive(),
  title: z.string(),
  price: z.number(),
  stock: z.number(),
  status: z.string(),
  images: z
    .array(
      z.object({
        imageId: z.string(),
        variants: z.array(
          z.object({ url: z.string(), width: z.number(), height: z.number() }),
        ),
      }),
    )
    .optional(),
});
export const productPageSchema = z.object({
  content: z.array(productSchema),
  totalElements: z.number(),
  totalPages: z.number(),
});
export const generationSchema = z.object({
  generationId: z.number().int().positive(),
  productId: z.number().int().positive(),
  status: z.enum([
    "QUEUED",
    "PROCESSING",
    "ANALYZING",
    "DRAFT_READY",
    "COMPLETED",
    "FAILED",
  ]),
});
export const contentStatusSchema = z.enum([
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
]);
export const contentSchema = z.object({
  contentId: z.number().int().positive(),
  productId: z.number().int().positive(),
  status: contentStatusSchema,
  version: z.number().int(),
  reactDocument: z.unknown().transform(parseDocument),
  blocks: z
    .array(
      z.object({
        order: z.number(),
        tag: z.string(),
        imageVariants: z
          .array(
            z.object({
              url: z.string(),
              width: z.number(),
              height: z.number(),
            }),
          )
          .nullish(),
      }),
    )
    .optional(),
});
export type SellerProduct = z.infer<typeof productSchema>;
export type SellerContent = z.infer<typeof contentSchema>;
export type Generation = z.infer<typeof generationSchema>;
export interface GenerationInput {
  images: string[];
  productName: string;
  howMade: string;
  careTips: string;
}
const id = (value: number) => {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error("올바르지 않은 상품 경로입니다.");
  return value;
};
const base = (productId: number) => `/api/content/products/${id(productId)}`;
export async function listSellerProducts(page = 0) {
  return productPageSchema.parse(
    await clientFetch("/api/products/me?page=" + page + "&size=20"),
  );
}
export async function createSellerProduct(input: {
  title: string;
  price: number;
  stock: number;
}) {
  return productSchema.parse(
    await clientFetch("/api/products", { method: "POST", body: input }),
  );
}
export async function startGeneration(
  productId: number,
  input: GenerationInput,
) {
  return generationSchema.parse(
    await clientFetch(base(productId) + "/generations", {
      method: "POST",
      body: input,
    }),
  );
}
export async function getGeneration(
  productId: number,
  generationId: number,
  signal?: AbortSignal,
) {
  return generationSchema.parse(
    await clientFetch(base(productId) + "/generations/" + id(generationId), {
      signal,
    }),
  );
}
export async function getContent(productId: number, signal?: AbortSignal) {
  return contentSchema.parse(
    await clientFetch(base(productId) + "/contents", { signal }),
  );
}
export async function saveContent(
  productId: number,
  contentId: number,
  patches: NodePatch[],
) {
  const response = await clientFetch(
    base(productId) + "/contents/" + id(contentId),
    { method: "PATCH", body: { patches } },
  );
  return z
    .object({
      contentId: z.number(),
      productId: z.number(),
      status: contentStatusSchema,
      version: z.number(),
    })
    .parse(response);
}
export async function changeContentStatus(
  productId: number,
  contentId: number,
  action: "submit" | "approve" | "reject" | "publish",
  approval?: {
    factCheckConfirmed: boolean;
    photoMatchConfirmed: boolean;
    displayApprovalBadge: boolean;
  },
) {
  const path =
    action === "publish"
      ? base(productId) + "/publish"
      : base(productId) + "/contents/" + id(contentId) + "/" + action;
  return z.object({ contentId: z.number(), status: contentStatusSchema }).parse(
    await clientFetch(path, {
      method: "POST",
      ...(approval ? { body: approval } : {}),
    }),
  );
}

export async function getSellerProduct(
  productId: number,
  signal?: AbortSignal,
) {
  const result = productSchema.parse(
    await clientFetch(`/api/products/${id(productId)}`, { signal }),
  );
  if (result.productId !== productId)
    throw new Error("상품 정보가 일치하지 않습니다.");
  return result;
}
