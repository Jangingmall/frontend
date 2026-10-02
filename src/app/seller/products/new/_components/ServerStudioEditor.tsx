"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import type { SellerContent } from "@/api/seller-studio/api";
import { sellerKeys } from "@/queries/seller-studio/queries";
import { useSellerStudioRuntime } from "@/queries/seller-studio/runtime";
import { useAuthStore } from "@/stores/auth";
import { editNode } from "@/utils/seller-studio/document";

import {
  contentImages,
  type DocumentEditorSnapshot,
  fileToDataUrl,
  readServerDocumentSnapshot,
  type ServerDocumentIdentity,
  writeServerDocumentSnapshot,
} from "./document-editor-storage";
import { DocumentStudioEditor } from "./DocumentStudioEditor";
import { supportedPatches } from "./studio-document-editing";

export function ServerStudioEditor({ content }: { content: SellerContent }) {
  const ownerId = useAuthStore((state) => state.user?.id ?? 0);
  return (
    <ScopedEditor
      key={`${ownerId}:${content.contentId}`}
      ownerId={ownerId}
      content={content}
    />
  );
}

function ScopedEditor({
  content,
  ownerId,
}: {
  content: SellerContent;
  ownerId: number;
}) {
  const runtime = useSellerStudioRuntime();
  const client = useQueryClient();
  const [initialContent] = useState(content);
  const identity = useRef<ServerDocumentIdentity>({
    ownerId,
    productId: content.productId,
    contentId: content.contentId,
    version: content.version,
  });
  const baseline = useRef(content.reactDocument);
  const [restored, setRestored] = useState<DocumentEditorSnapshot | null>();
  const editable = content.status === "DRAFT" || content.status === "REJECTED";
  useEffect(() => {
    const timer = setTimeout(
      () => setRestored(readServerDocumentSnapshot(identity.current) ?? null),
      0,
    );
    return () => clearTimeout(timer);
  }, []);
  if (restored === undefined)
    return <p role="status">저장한 편집 내용을 확인하고 있습니다.</p>;
  function persist(snapshot: DocumentEditorSnapshot) {
    if (!editable) return true;
    try {
      writeServerDocumentSnapshot(identity.current, snapshot);
      return true;
    } catch {
      return false;
    }
  }
  async function save(snapshot: DocumentEditorSnapshot) {
    if (!editable)
      throw new Error("현재 상태에서는 내용을 수정할 수 없습니다.");
    const patches = supportedPatches(baseline.current, snapshot.document);
    if (patches.length) {
      const result = await runtime.api.saveContent(
        content.productId,
        content.contentId,
        patches,
      );
      // 서버에 없는 추가 페이지·노드는 다음 요청의 patch 기준에 포함하지 않는다.
      for (const { nodeId, ...patch } of patches)
        baseline.current = editNode(baseline.current, nodeId, patch);
      identity.current = { ...identity.current, version: result.version };
      client.setQueryData<SellerContent>(
        [
          ...sellerKeys.all,
          runtime.scope ?? ownerId,
          "content",
          content.productId,
        ],
        {
          ...initialContent,
          ...result,
          reactDocument: baseline.current,
        },
      );
    }
    writeServerDocumentSnapshot(identity.current, snapshot);
  }
  async function upload(file: File) {
    if (!editable)
      throw new Error("현재 상태에서는 사진을 수정할 수 없습니다.");
    const url = await fileToDataUrl(file);
    const imageId = await runtime.uploadImage(file, "CONTENT");
    return { imageId, url };
  }
  return (
    <DocumentStudioEditor
      initialDocument={restored?.document ?? initialContent.reactDocument}
      initialImages={{ ...contentImages(initialContent), ...restored?.images }}
      productId={content.productId}
      editable={editable}
      initialReview={restored?.review ?? false}
      onSave={save}
      onPersist={persist}
      onUpload={upload}
    />
  );
}
