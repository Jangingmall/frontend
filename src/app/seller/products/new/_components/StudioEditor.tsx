"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { ContractPreview } from "./ContractPreview";
import type {
  StudioAsset,
  StudioDraft,
  StudioSection,
} from "./studio-contract";
import { buildPreview, editSection } from "./studio-contract";
import { readImages } from "./studio-state";
interface Props {
  draft: StudioDraft;
  assets: StudioAsset[];
  onEdit: (draft: StudioDraft) => void;
  onAssets: (assets: StudioAsset[]) => void;
  onSave: () => void;
  onReview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saved: string;
  onUploadPending: (pending: boolean) => void;
}
export function StudioEditor({
  draft,
  assets,
  onEdit,
  onAssets,
  onSave,
  onReview,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saved,
  onUploadPending,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<"pages" | "layout" | "text" | "image">(
    "pages",
  );
  const [error, setError] = useState("");
  const [isUploading, setUploading] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadLock = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const replaceId = useRef<string | null>(null);
  const section = draft.page_plan.find((item) => item.section_id === selected);
  const document = buildPreview(draft);
  function patch(value: Partial<StudioSection>) {
    if (section) onEdit(editSection(draft, section.section_id, value));
  }
  function select(id: string) {
    setSelected(id);
    window.document
      .getElementById(`page-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function move(id: string, delta: number) {
    const index = draft.page_plan.findIndex((item) => item.section_id === id);
    const target = index + delta;
    if (target < 0 || target >= draft.page_plan.length) return;
    const pages = [...draft.page_plan];
    [pages[index], pages[target]] = [pages[target], pages[index]];
    onEdit({ ...draft, page_plan: pages });
  }
  function add(source?: StudioSection) {
    if (draft.page_plan.length >= 14) return;
    const id = `page-${crypto.randomUUID()}`;
    const item: StudioSection = source
      ? { ...source, section_id: id, block_type: "statement" }
      : {
          section_id: id,
          block_type: "statement",
          eyebrow: "",
          title: "새 페이지",
          body: "상품에 관한 설명을 입력해 주세요.",
          variant: "paper",
          photo_id: "",
          photo_ids: [],
          items: [],
        };
    onEdit({ ...draft, page_plan: [...draft.page_plan, item] });
    setSelected(id);
    setPanel("text");
  }
  async function upload(files: FileList | null) {
    if (!files?.length || uploadLock.current) return;
    uploadLock.current = true;
    setUploading(true);
    onUploadPending(true);
    setError("");
    try {
      const replacing = replaceId.current;
      if (replacing && files.length !== 1)
        throw new Error("교체할 사진 한 장을 선택해 주세요.");
      const next = await readImages(
        Array.from(files),
        replacing ? assets.length - 1 : assets.length,
      );
      if (!isMounted.current) return;
      onAssets(
        replacing
          ? assets.map((asset) =>
              asset.imageId === replacing
                ? { ...next[0], imageId: replacing }
                : asset,
            )
          : [...assets, ...next],
      );
    } catch (error) {
      if (!isMounted.current) return;
      setError(
        error instanceof Error ? error.message : "사진을 읽지 못했습니다.",
      );
    } finally {
      uploadLock.current = false;
      if (isMounted.current) {
        setUploading(false);
        onUploadPending(false);
      }
    }
  }
  return (
    <div
      className={`ss-editor ss-panel-${panel} ${isExpanded ? "is-expanded" : ""}`}
    >
      <nav className="ss-tools" aria-label="편집 도구">
        <div>
          {(
            [
              ["pages", "페이지 목록", "layers"],
              ["layout", "페이지 구성", "add"],
              ["text", "텍스트 편집", "text"],
              ["image", "이미지 편집", "image"],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              type="button"
              key={id}
              title={label}
              aria-label={label}
              aria-pressed={panel === id}
              onClick={() => {
                setPanel(id);
                if (id === "text" || id === "image")
                  setSelected(selected ?? draft.page_plan[0].section_id);
              }}
            >
              <Image
                src={`/seller-studio/${icon}.svg`}
                width={24}
                height={24}
                alt=""
              />
            </button>
          ))}
        </div>
        <div>
          <button
            type="button"
            title="실행 취소"
            aria-label="실행 취소"
            disabled={!canUndo || isUploading}
            onClick={onUndo}
          >
            <Image
              src="/seller-studio/undo.svg"
              width={20}
              height={20}
              alt=""
            />
          </button>
          <button
            type="button"
            title="다시 실행"
            aria-label="다시 실행"
            disabled={!canRedo || isUploading}
            onClick={onRedo}
          >
            <Image
              src="/seller-studio/redo.svg"
              width={20}
              height={20}
              alt=""
            />
          </button>
        </div>
      </nav>
      <aside className="ss-page-list" aria-label="페이지 목록">
        {draft.page_plan.map((item, index) => (
          <button
            type="button"
            key={item.section_id}
            aria-pressed={selected === item.section_id}
            onClick={() => select(item.section_id)}
          >
            <Image
              src="/seller-studio/drag.svg"
              width={16}
              height={16}
              alt=""
            />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>{item.title || "제목 없음"}</span>
          </button>
        ))}
        {panel === "layout" && (
          <div className="ss-layout-panel">
            <h2>페이지 구성</h2>
            <button
              className="ss-button"
              type="button"
              disabled={draft.page_plan.length >= 14}
              onClick={() => add()}
            >
              페이지 추가
            </button>
            <label>
              전체 배치
              <select
                aria-label="전체 배치"
                value={draft.layout_id}
                onChange={(event) =>
                  onEdit({
                    ...draft,
                    layout_id: event.target.value as StudioDraft["layout_id"],
                  })
                }
              >
                <option value="editorial-split">이야기 중심</option>
                <option value="image-first">이미지 중심</option>
                <option value="catalog-grid">특징 중심</option>
              </select>
            </label>
            <small>최대 14페이지</small>
          </div>
        )}
      </aside>
      <div className="ss-editor-actions">
        <span role="status">{saved}</span>
        <button
          className="ss-button"
          type="button"
          disabled={isUploading}
          onClick={onSave}
        >
          임시 저장
        </button>
        <button
          className="ss-button ss-primary"
          type="button"
          disabled={isUploading}
          onClick={onReview}
        >
          제작 완료
        </button>
      </div>
      <div className="ss-canvas" aria-label="편집 캔버스">
        {draft.page_plan.map((item, index) => (
          <section
            id={`page-${item.section_id}`}
            className={`ss-page ${selected === item.section_id ? "is-selected" : ""}`}
            key={item.section_id}
          >
            <div className="ss-page-bar">
              <button
                type="button"
                className="ss-page-title"
                onClick={() =>
                  setSelected(
                    selected === item.section_id ? null : item.section_id,
                  )
                }
              >
                <b>페이지 {index + 1}</b> - {item.title || "제목 없음"}
              </button>
              {selected === item.section_id && (
                <div className="ss-page-controls">
                  {(["paper", "soft", "ink"] as const).map((variant) => (
                    <button
                      type="button"
                      className={`ss-swatch ${variant}`}
                      key={variant}
                      aria-label={`${variant} 배경`}
                      aria-pressed={item.variant === variant}
                      onClick={() => patch({ variant })}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label="페이지 위로 이동"
                    disabled={index === 0}
                    onClick={() => move(item.section_id, -1)}
                  >
                    ⌃
                  </button>
                  <button
                    type="button"
                    aria-label="페이지 아래로 이동"
                    disabled={index === draft.page_plan.length - 1}
                    onClick={() => move(item.section_id, 1)}
                  >
                    ⌄
                  </button>
                  <button
                    type="button"
                    aria-label="페이지 복제"
                    disabled={draft.page_plan.length >= 14}
                    onClick={() => add(item)}
                  >
                    ⧉
                  </button>
                  <button
                    type="button"
                    aria-label="페이지 삭제"
                    disabled={draft.page_plan.length === 1}
                    onClick={() => {
                      onEdit({
                        ...draft,
                        page_plan: draft.page_plan.filter(
                          (page) => page.section_id !== item.section_id,
                        ),
                      });
                      setSelected(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className="ss-page-paper">
              <button
                type="button"
                className="ss-page-select"
                aria-label={`페이지 ${index + 1} 편집`}
                onClick={() => {
                  setSelected(item.section_id);
                  setPanel("text");
                }}
              />
              <ContractPreview
                document={{ ...document, root: [document.root[index]] }}
                assets={assets}
              />
            </div>
            {selected === item.section_id &&
              (panel === "text" || panel === "image") && (
                <div className="ss-property-panel">
                  <button
                    type="button"
                    className="ss-panel-close"
                    aria-label="편집 패널 닫기"
                    onClick={() => setPanel("pages")}
                  >
                    ×
                  </button>
                  {panel === "text" ? (
                    <>
                      <h2>텍스트 편집</h2>
                      {(
                        [
                          ["eyebrow", "작은 제목", 120],
                          ["title", "제목", 80],
                          ["body", "설명", 300],
                        ] as const
                      ).map(([key, label, max]) => (
                        <label key={key}>
                          {label}
                          <textarea
                            aria-label={`섹션 ${label}`}
                            maxLength={max}
                            rows={key === "body" ? 4 : 2}
                            value={item[key]}
                            onChange={(event) =>
                              patch({ [key]: event.target.value })
                            }
                          />
                        </label>
                      ))}
                      {item.items.map((feature, index) => (
                        <div key={index}>
                          <label>
                            특징 {index + 1}
                            <input
                              aria-label={`특징 ${index + 1} 제목`}
                              maxLength={80}
                              value={feature.title}
                              onChange={(event) =>
                                patch({
                                  items: item.items.map((value, position) =>
                                    position === index
                                      ? { ...value, title: event.target.value }
                                      : value,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label>
                            특징 설명
                            <textarea
                              aria-label={`특징 ${index + 1} 설명`}
                              maxLength={300}
                              value={feature.description}
                              onChange={(event) =>
                                patch({
                                  items: item.items.map((value, position) =>
                                    position === index
                                      ? {
                                          ...value,
                                          description: event.target.value,
                                        }
                                      : value,
                                  ),
                                })
                              }
                            />
                          </label>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <h2>이미지 편집</h2>
                      <div className="ss-image-picker">
                        {assets.map((asset) => (
                          <button
                            type="button"
                            key={asset.imageId}
                            aria-label={`${asset.alt} 사용`}
                            aria-pressed={item.photo_id === asset.imageId}
                            onClick={() => patch({ photo_id: asset.imageId })}
                          >
                            <Image
                              src={asset.url}
                              width={80}
                              height={80}
                              alt={asset.alt}
                              unoptimized
                            />
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={isUploading || assets.length >= 8}
                          onClick={() => {
                            replaceId.current = null;
                            fileInput.current?.click();
                          }}
                        >
                          ＋<small>사진 첨부하기</small>
                        </button>
                      </div>
                      {item.photo_id && (
                        <button
                          className="ss-button"
                          type="button"
                          disabled={isUploading}
                          onClick={() => {
                            replaceId.current = item.photo_id;
                            fileInput.current?.click();
                          }}
                        >
                          선택 사진 교체
                        </button>
                      )}
                      {item.photo_id && (
                        <p className="ss-image-help">
                          교체하면 이 사진을 사용한 모든 페이지에 반영됩니다.
                        </p>
                      )}
                      <input
                        ref={fileInput}
                        className="sr-only"
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        aria-label="편집 사진 첨부"
                        onChange={(event) => {
                          void upload(event.target.files);
                          event.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className="ss-button"
                        disabled={!item.photo_id}
                        onClick={() => patch({ photo_id: "" })}
                      >
                        이미지 삭제하기
                      </button>
                      {error && <p role="alert">{error}</p>}
                    </>
                  )}
                </div>
              )}
          </section>
        ))}
      </div>
      <button
        className="ss-expand"
        type="button"
        aria-label={isExpanded ? "도구 패널 펼치기" : "캔버스 넓게 보기"}
        onClick={() => setExpanded(!isExpanded)}
      >
        <Image src="/seller-studio/expand.svg" width={32} height={32} alt="" />
      </button>
    </div>
  );
}
