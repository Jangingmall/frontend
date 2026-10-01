import { z } from "zod";

import type { SellerContent } from "@/api/seller-studio/api";
import { productSchema } from "@/api/seller-studio/api";
import {
  flattenDocument,
  imageReferences,
  parseDocument,
  safeImageUrl,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import { demoSnapshotSchema, renderDemoSection } from "./demo-editor-document";
import { buildPreview } from "./studio-contract";

export interface DocumentEditorSnapshot {
  document: StudioDocument;
  images: Record<string, string>;
  review: boolean;
}
export interface ServerDocumentIdentity {
  ownerId: number;
  productId: number;
  contentId: number;
  version: number;
}
const imageUrlSchema = z
  .string()
  .refine(
    (value) =>
      Boolean(safeImageUrl(value)) ||
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value),
    "저장할 수 없는 이미지 주소입니다.",
  );
const snapshotFields = {
  document: z.unknown().transform(parseDocument),
  images: z.record(z.string(), imageUrlSchema),
  review: z.boolean(),
};
export const documentEditorSnapshotSchema = z.object(snapshotFields);
export const demoDocumentSnapshotSchema = z.object({
  format: z.literal("document-v1"),
  ...snapshotFields,
  document: snapshotFields.document.transform(repairDemoUsageScene),
  productId: z.number().int().nonnegative(),
  product: productSchema.optional(),
});
export type DemoDocumentSnapshot = z.infer<typeof demoDocumentSnapshotSchema>;

/** 이전 부채 시연 초안의 666px 폭만 보정하고 사용자가 편집한 노드는 유지한다. */
function repairDemoUsageScene(document: StudioDocument): StudioDocument {
  return {
    ...document,
    root: document.root.map((section) => {
      const style = section.props?.style;
      if (
        !section.id.endsWith("section-05-usage_scene-root") ||
        style?.maxWidth !== 666 ||
        style.gridTemplateColumns !== "minmax(0,350fr) minmax(0,316fr)"
      )
        return section;
      return {
        ...section,
        props: {
          ...section.props,
          style: { ...style, maxWidth: document.canvasWidth },
        },
        children: section.children?.map((node) =>
          node.tag === "img" && node.props?.style?.objectFit === "cover"
            ? {
                ...node,
                props: {
                  ...node.props,
                  style: { ...node.props.style, objectFit: "contain" },
                },
              }
            : node,
        ),
      };
    }),
  };
}

const serverSnapshotSchema = z.object({
  ownerId: z.number().int().nonnegative(),
  productId: z.number().int().positive(),
  contentId: z.number().int().positive(),
  version: z.number().int().nonnegative(),
  snapshot: documentEditorSnapshotSchema,
});
export function serverDocumentStorageKey(identity: ServerDocumentIdentity) {
  return `midam-seller-document-v1:${identity.ownerId}:${identity.productId}:${identity.contentId}`;
}
export function writeServerDocumentSnapshot(
  identity: ServerDocumentIdentity,
  snapshot: DocumentEditorSnapshot,
) {
  const record = serverSnapshotSchema.parse({ ...identity, snapshot });
  localStorage.setItem(
    serverDocumentStorageKey(identity),
    JSON.stringify(record),
  );
}
export function readServerDocumentSnapshot(
  identity: ServerDocumentIdentity,
): DocumentEditorSnapshot | undefined {
  try {
    const raw = localStorage.getItem(serverDocumentStorageKey(identity));
    if (!raw) return;
    const record = serverSnapshotSchema.parse(JSON.parse(raw));
    if (
      record.ownerId !== identity.ownerId ||
      record.productId !== identity.productId ||
      record.contentId !== identity.contentId ||
      record.version !== identity.version
    )
      return;
    return record.snapshot;
  } catch {
    return;
  }
}
export function parseDemoDocumentSnapshot(raw: string): DemoDocumentSnapshot {
  const value: unknown = JSON.parse(raw);
  if (value && typeof value === "object" && "format" in value)
    return demoDocumentSnapshotSchema.parse(value);
  const old = demoSnapshotSchema.parse(value);
  const document = parseDocument({
    ...old.source,
    root: old.draft.page_plan.flatMap(
      (section) =>
        (
          renderDemoSection(old.source, section, old.draft.layout_id) ??
          parseDocument(buildPreview({ ...old.draft, page_plan: [section] }))
        ).root,
    ),
  });
  return demoDocumentSnapshotSchema.parse({
    format: "document-v1",
    document,
    images: Object.fromEntries(
      old.assets.map((asset) => [asset.imageId, asset.url]),
    ),
    review: old.status === "result",
    productId: old.product?.productId ?? 0,
    product: old.product,
  });
}

export function contentImages(content: SellerContent): Record<string, string> {
  const photos = flattenDocument(content.reactDocument).filter(
    (node) => node.tag === "img",
  );
  const images = imageReferences(
    (content.blocks ?? []).flatMap((block) =>
      (block.imageVariants ?? []).map((variant) => variant.url),
    ),
    photos.flatMap((node) => (node.props?.imageId ? [node.props.imageId] : [])),
  );
  for (const node of photos) {
    const source =
      safeImageUrl(node.props?.src) ?? safeImageUrl(node.props?.imageId);
    if (source) images[node.props?.imageId ?? source] = source;
  }
  return images;
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("JPG, PNG, WebP 사진을 10MB 이내로 선택해 주세요.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(imageUrlSchema.parse(String(reader.result)));
      } catch {
        reject(new Error("사진을 읽지 못했습니다."));
      }
    };
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
