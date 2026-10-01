"use client";
import "./seller-studio.css";

import { useCallback, useEffect, useReducer, useState } from "react";

import type { SellerContent, SellerProduct } from "@/api/seller-studio/api";
import { useSellerProduct } from "@/queries/seller-studio/queries";
import { useSellerStudioRuntime } from "@/queries/seller-studio/runtime";

import { ContractPreview } from "./ContractPreview";
import {
  createDemoDraft,
  type DemoSnapshot,
  demoSnapshotSchema,
  demoStorageKey,
  renderDemoSection,
} from "./demo-editor-document";
import { ServerDocument } from "./ServerDocument";
import { buildPreview, type StudioSection } from "./studio-contract";
import { historyReducer } from "./studio-state";
import { StudioEditor } from "./StudioEditor";
import { StudioReview } from "./StudioReview";

export function DemoFrontendEditor({
  content,
  restored,
}: {
  content?: SellerContent;
  restored?: DemoSnapshot;
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
  product?: SellerProduct;
  content?: SellerContent;
  restored?: DemoSnapshot;
}) {
  const runtime = useSellerStudioRuntime();
  const [source] = useState(() => restored?.source ?? content!.reactDocument);
  const [state, dispatch] = useReducer(historyReducer, undefined, () => ({
    ...(restored ??
      createDemoDraft(
        source,
        product?.title ?? runtime.initialInput?.values.productName ?? "작품",
      )),
    past: [],
    future: [],
  }));
  const [step, setStep] = useState<"editing" | "result">(
    restored?.status ?? "editing",
  );
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const serialized = JSON.stringify({
    draft: state.draft,
    assets: state.assets,
  });
  const [saved, setSaved] = useState(restored ? serialized : "");
  const dirty = saved !== serialized;
  useEffect(() => {
    if (!dirty && !uploading) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, uploading]);
  const persist = useCallback(
    (status = step) => {
      try {
        const record = demoSnapshotSchema.parse({
          draft: state.draft,
          assets: state.assets,
          source,
          product,
          status,
        });
        const url = runtime.studioUrl(0);
        localStorage.setItem(
          demoStorageKey(url.slice(-1)),
          JSON.stringify(record),
        );
        window.history.replaceState(null, "", `${url}?draft=1`);
        setSaved(serialized);
        setError("");
        return true;
      } catch {
        setError(
          "저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요. 편집 내용은 유지됩니다.",
        );
        return false;
      }
    },
    [step, state.draft, state.assets, source, product, runtime, serialized],
  );
  useEffect(() => {
    if (!runtime.setNavigationGuard) return;
    runtime.setNavigationGuard(() => {
      if (uploading) {
        setError("사진 준비가 끝난 후 이동해 주세요.");
        return false;
      }
      return !dirty || persist();
    });
    return () => {
      runtime.setNavigationGuard?.(null);
    };
  }, [runtime, uploading, dirty, persist]);
  const images = Object.fromEntries(
    state.assets.map((asset) => [asset.imageId, asset.url]),
  );
  function preview(section: StudioSection) {
    const preserved = renderDemoSection(source, section, state.draft.layout_id);
    if (preserved)
      return <ServerDocument document={preserved} images={images} fitCanvas />;
    return (
      <ContractPreview
        document={buildPreview({ ...state.draft, page_plan: [section] })}
        assets={state.assets}
      />
    );
  }
  return (
    <div className="demo-frontend-editor">
      {error && <p role="alert">{error}</p>}
      {step === "editing" ? (
        <StudioEditor
          draft={state.draft}
          assets={state.assets}
          assetLimit={32}
          renderPreview={preview}
          onEdit={(draft) => dispatch({ type: "edit", draft })}
          onAssets={(assets) => dispatch({ type: "assets", assets })}
          onUndo={() => dispatch({ type: "undo" })}
          onRedo={() => dispatch({ type: "redo" })}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          onSave={() => persist()}
          onReview={() => {
            if (persist("result")) setStep("result");
          }}
          saved={dirty ? "미저장 변경사항" : "저장됨"}
          onUploadPending={setUploading}
        />
      ) : (
        <StudioReview
          draft={state.draft}
          assets={state.assets}
          demoStatus={false}
          sale={product}
          preview={
            <>
              {state.draft.page_plan.map((section) => (
                <div key={section.section_id}>{preview(section)}</div>
              ))}
            </>
          }
          onBack={() => {
            setCompleted(false);
            setStep("editing");
          }}
          onSave={() => persist()}
          onComplete={() => {
            if (persist("result")) setCompleted(true);
          }}
          isCompleted={completed}
        />
      )}
    </div>
  );
}
