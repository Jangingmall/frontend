"use client";
import "./seller-studio.css";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";

import type { StudioAsset, StudioDraft } from "./studio-contract";
import { buildPreview, draftSchema, parseContract } from "./studio-contract";
import { exampleAssets, exampleDraft } from "./studio-fixture";
import { historyReducer, readSavedDraft, STORAGE_PREFIX } from "./studio-state";
import { StudioEditor } from "./StudioEditor";
import { StudioInput } from "./StudioInput";
import { StudioReview } from "./StudioReview";
export function SellerStudio({
  projectId,
  isExample,
}: {
  projectId?: string;
  isExample: boolean;
}) {
  const [state, dispatch] = useReducer(historyReducer, {
    draft: exampleDraft,
    assets: exampleAssets,
    past: [],
    future: [],
  });
  const assets = state.assets;
  const setAssets = (assets: StudioAsset[]) =>
    dispatch({ type: "assets", assets });
  const [step, setStep] = useState<
    "input" | "generating" | "editing" | "result"
  >("input");
  const [isUploading, setUploading] = useState(false);
  const [saved, setSaved] = useState("아직 저장하지 않음");
  const [snapshot, setSnapshot] = useState("");
  const [error, setError] = useState("");
  const [isRestoring, setRestoring] = useState(Boolean(projectId));
  const activeId = useRef(projectId ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCompleted, setCompleted] = useState(false);
  const serialized = JSON.stringify({ draft: state.draft, assets });
  const isDirty =
    step !== "input" &&
    step !== "generating" &&
    (isUploading || snapshot !== serialized);
  useEffect(() => {
    const restore = setTimeout(() => {
      try {
        if (projectId) {
          const raw = localStorage.getItem(STORAGE_PREFIX + projectId);
          if (!raw) throw new Error();
          const record = readSavedDraft(raw);
          dispatch({
            type: "load",
            draft: record.draft,
            assets: record.assets,
          });
          setSnapshot(
            JSON.stringify({ draft: record.draft, assets: record.assets }),
          );
          setStep(record.status === "result" ? "result" : "editing");
          setSaved("이 브라우저에 저장됨");
        } else if (isExample) {
          dispatch({ type: "load", draft: exampleDraft });
          setStep("editing");
        }
      } catch {
        setError(
          "저장된 초안을 복원하지 못했습니다. 새 초안을 만들 수 있습니다.",
        );
      } finally {
        setRestoring(false);
      }
    }, 0);
    return () => {
      clearTimeout(restore);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [projectId, isExample]);
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  function persist(
    draft: StudioDraft,
    list: StudioAsset[],
    status: "draft" | "result",
  ) {
    try {
      draftSchema.parse(draft);
      parseContract(buildPreview(draft), list);
      const id = activeId.current || crypto.randomUUID();
      const record = JSON.stringify({ draft, assets: list, status });
      readSavedDraft(record);
      localStorage.setItem(STORAGE_PREFIX + id, record);
      activeId.current = id;
      window.history.replaceState(
        null,
        "",
        `/seller/products/new?project=${encodeURIComponent(id)}`,
      );
      setSnapshot(JSON.stringify({ draft, assets: list }));
      setSaved("이 브라우저에 저장됨");
      setError("");
      return true;
    } catch {
      setError(
        "저장하지 못했습니다. 입력 내용 또는 브라우저 저장 공간을 확인해 주세요. 편집 내용은 유지됩니다.",
      );
      return false;
    }
  }
  function generate(draft: StudioDraft, list: StudioAsset[]) {
    activeId.current = "";
    setStep("generating");
    setError("");
    timer.current = setTimeout(() => {
      dispatch({ type: "load", draft, assets: list });
      persist(draft, list, "draft");
      setStep("editing");
    }, 1800);
  }
  if (isRestoring)
    return (
      <div className="ss-shell">
        <p className="ss-loading" role="status">
          저장한 초안을 불러오고 있습니다.
        </p>
      </div>
    );
  const current =
    step === "input"
      ? 0
      : step === "generating"
        ? 1
        : step === "editing"
          ? 2
          : 3;
  return (
    <div className={`ss-shell ss-${step}`}>
      {step !== "result" && (
        <header className="ss-header">
          <Link
            href="/seller/products"
            className="ss-logo"
            onClick={(event) => {
              if (isUploading) {
                event.preventDefault();
                setError("사진 준비가 끝난 후 이동해 주세요.");
                return;
              }
              if (isDirty && !persist(state.draft, assets, "draft"))
                event.preventDefault();
            }}
          >
            로고
          </Link>
          <span>판매 관리</span>
        </header>
      )}
      {error && (
        <p className="ss-global-error" role="alert">
          {error}
        </p>
      )}
      {(step === "input" || step === "generating") && (
        <div className="ss-form-wrap">
          <div className="ss-heading">
            <h1>AI 상세페이지 제작</h1>
            <ol aria-label="제작 단계">
              {["정보 입력", "생성 중", "편집", "최종 확인"].map(
                (label, index) => (
                  <li
                    key={label}
                    aria-current={current === index ? "step" : undefined}
                  >
                    {index > 0 && <span aria-hidden="true">›</span>}
                    {String(index + 1).padStart(2, "0")} {label}
                  </li>
                ),
              )}
            </ol>
          </div>
          {step === "input" ? (
            <>
              <p className="ss-intro">
                작품 사진과 제작 정보를 입력하면 AI가 상세페이지를 만들어
                드립니다.
              </p>
              <StudioInput onGenerate={generate} />
              <p className="ss-demo-note">
                시연 모드 · 입력한 정보로 초안을 구성하며, 이 브라우저에만
                저장됩니다.{" "}
                <Link href="/seller/products/new?example=1">예시 보기</Link>
              </p>
            </>
          ) : (
            <div className="ss-generating" role="status">
              <div className="ss-loading-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <h2>AI가 상세페이지 초안을 만들고 있어요.</h2>
              <p>시연 모드 · 입력한 정보로 초안을 구성합니다.</p>
              <small>창을 닫지 않고 기다려 주세요.</small>
            </div>
          )}
        </div>
      )}
      {step === "editing" && (
        <StudioEditor
          onUploadPending={setUploading}
          draft={state.draft}
          assets={assets}
          onEdit={(draft) => dispatch({ type: "edit", draft })}
          onAssets={setAssets}
          onSave={() => persist(state.draft, assets, "draft")}
          onReview={() => {
            if (persist(state.draft, assets, "draft")) setStep("result");
          }}
          onUndo={() => dispatch({ type: "undo" })}
          onRedo={() => dispatch({ type: "redo" })}
          canUndo={state.past.length > 0}
          canRedo={state.future.length > 0}
          saved={isDirty ? "미저장 변경사항 · 브라우저 저장" : saved}
        />
      )}
      {step === "result" && (
        <StudioReview
          draft={state.draft}
          assets={assets}
          onBack={() => {
            setCompleted(false);
            setStep("editing");
          }}
          onSave={() => persist(state.draft, assets, "draft")}
          onComplete={() => {
            if (persist(state.draft, assets, "result")) setCompleted(true);
          }}
          isCompleted={isCompleted}
        />
      )}
    </div>
  );
}
