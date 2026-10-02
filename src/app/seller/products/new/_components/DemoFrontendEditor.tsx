"use client";

import type { SellerContent, SellerProduct } from "@/api/seller-studio/api";
import { useSellerProduct } from "@/queries/seller-studio/queries";
import { useSellerStudioRuntime } from "@/queries/seller-studio/runtime";

import { demoStorageKey } from "./demo-editor-document";
import {
  contentImages,
  type DemoDocumentSnapshot,
  demoDocumentSnapshotSchema,
  type DocumentEditorSnapshot,
  fileToDataUrl,
} from "./document-editor-storage";
import { DocumentStudioEditor } from "./DocumentStudioEditor";

export function DemoFrontendEditor({
  content,
  restored,
}: {
  content?: SellerContent;
  restored?: DemoDocumentSnapshot;
}) {
  return restored ? (
    <FrontendEditor restored={restored} product={restored.product} />
  ) : (
    <GeneratedEditor content={content!} />
  );
}
function GeneratedEditor({ content }: { content: SellerContent }) {
  const product = useSellerProduct(content.productId, 0);
  if (product.isPending)
    return <p role="status">작품 정보를 불러오고 있습니다.</p>;
  if (product.isError && !product.data)
    return (
      <div role="alert">
        작품 정보를 불러오지 못했습니다.
        <button onClick={() => void product.refetch()}>다시 시도</button>
      </div>
    );
  return <FrontendEditor content={content} product={product.data} />;
}
function FrontendEditor({
  content,
  restored,
  product,
}: {
  content?: SellerContent;
  restored?: DemoDocumentSnapshot;
  product?: SellerProduct;
}) {
  const runtime = useSellerStudioRuntime();
  const productId = restored?.productId ?? content!.productId;
  function save(snapshot: DocumentEditorSnapshot) {
    const record = demoDocumentSnapshotSchema.parse({
      format: "document-v1",
      ...snapshot,
      productId,
      product,
    });
    const url = runtime.studioUrl(productId);
    localStorage.setItem(demoStorageKey(url.slice(-1)), JSON.stringify(record));
    window.history.replaceState(null, "", `${url}?draft=1`);
  }
  function persist(snapshot: DocumentEditorSnapshot) {
    try {
      save(snapshot);
      return true;
    } catch {
      return false;
    }
  }
  return (
    <DocumentStudioEditor
      initialDocument={restored?.document ?? content!.reactDocument}
      initialImages={restored?.images ?? contentImages(content!)}
      productId={productId}
      product={product}
      initialReview={restored?.review ?? false}
      onSave={async (snapshot) => save(snapshot)}
      onPersist={persist}
      onUpload={async (file) => ({
        imageId: `upload-${crypto.randomUUID()}`,
        url: await fileToDataUrl(file),
      })}
    />
  );
}
