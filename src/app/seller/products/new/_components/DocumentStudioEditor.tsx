"use client";
import "./seller-studio.css";
import "./document-studio.css";

import Image from "next/image";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

import type { SellerProduct } from "@/api/seller-studio/api";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { Toast } from "@/components/ui/toast";
import { useSellerStudioRuntime } from "@/queries/seller-studio/runtime";
import {
  type DocumentNode,
  parseDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import type { DocumentEditorSnapshot } from "./document-editor-storage";
import { ServerDocument } from "./ServerDocument";
import { ServerStudioReview } from "./ServerStudioReview";
import {
  addSection,
  addText,
  deleteNode,
  duplicateSection,
  findNode,
  moveSection,
  PAGE_LAYOUTS,
  replaceImage,
  sectionTitle,
  setSectionBackground,
  styleText,
  TEXT_STYLES,
  updateText,
} from "./studio-document-editing";
import { StudioHelp } from "./StudioHelp";

interface Props {
  initialDocument: StudioDocument;
  initialImages: Record<string, string>;
  productId: number;
  product?: SellerProduct;
  editable?: boolean;
  initialReview?: boolean;
  onSave: (snapshot: DocumentEditorSnapshot) => Promise<void>;
  onPersist?: (snapshot: DocumentEditorSnapshot) => boolean;
  onUpload: (file: File) => Promise<{ imageId: string; url: string }>;
}
type Frame = Pick<DocumentEditorSnapshot, "document" | "images">;
const backgrounds = [
  ["paper", "화이트", "#ffffff"],
  ["soft", "라이트 그레이", "#fafbfc"],
  ["ink", "다크 네이비", "#121b29"],
] as const;
const colors = [
  ["#121b29", "다크 네이비"],
  ["#414954", "다크 그레이"],
  ["#80858c", "그레이"],
  ["#ffffff", "화이트"],
] as const;
function Icon({ name }: { name: string }) {
  return (
    <Image src={`/seller-studio/${name}.svg`} width={24} height={24} alt="" />
  );
}
function Tool({
  label,
  icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon?: string }) {
  return (
    <button type="button" aria-label={label} data-tooltip={label} {...props}>
      {icon ? <Icon name={icon} /> : children}
    </button>
  );
}
function inheritedStyle(
  nodes: DocumentNode[],
  id: string,
  parent: CSSProperties = {},
): CSSProperties | undefined {
  for (const node of nodes) {
    const style = { ...parent, ...node.props?.style };
    if (node.id === id) return style;
    const found = inheritedStyle(node.children ?? [], id, style);
    if (found) return found;
  }
}
function normalizeColor(color: unknown) {
  return typeof color === "string"
    ? color
        .toLowerCase()
        .replace(/^#fff$/, "#ffffff")
        .replace(/^white$/, "#ffffff")
    : "";
}

export function DocumentStudioEditor({
  initialDocument,
  initialImages,
  productId,
  product,
  editable = true,
  initialReview = false,
  onSave,
  onPersist,
  onUpload,
}: Props) {
  const runtime = useSellerStudioRuntime();
  const [frame, setFrame] = useState<Frame>({
    document: initialDocument,
    images: initialImages,
  });
  const current = useRef(frame);
  const [past, setPast] = useState<Frame[]>([]);
  const [future, setFuture] = useState<Frame[]>([]);
  const [review, setReview] = useState(initialReview);
  const [device, setDevice] = useState(774);
  const [panel, setPanel] = useState("pages");
  const [sectionId, setSectionId] = useState<string>();
  const [nodeId, setNodeId] = useState<string>();
  const [deleting, setDeleting] = useState<string>();
  const [helpStep, setHelpStep] = useState<number | null>(0);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(JSON.stringify(frame));
  const [pendingText, setPendingText] = useState(false);
  const dirty = pendingText || saved !== JSON.stringify(frame);
  const canvas = useRef<HTMLDivElement>(null);
  const imageOptions = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | undefined>(undefined);
  const fileInput = useRef<HTMLInputElement>(null);
  const replacingPhoto = useRef<string | undefined>(undefined);
  const [position, setPosition] = useState<CSSProperties>();
  const selected = nodeId ? findNode(frame.document, nodeId) : undefined;
  const selectedStyle = nodeId
    ? (inheritedStyle(frame.document.root, nodeId) ?? {})
    : {};
  const selectedFontSize = Number.parseFloat(
    String(selectedStyle.fontSize ?? 16),
  );
  const selectedTextStyle = TEXT_STYLES.reduce((nearest, style) =>
    Math.abs(style.fontSize - selectedFontSize) <
    Math.abs(nearest.fontSize - selectedFontSize)
      ? style
      : nearest,
  );
  const blocked = !editable || busy;
  function change(document: StudioDocument, images = current.current.images) {
    if (busyRef.current || !editable) return;
    const next = { document, images };
    if (JSON.stringify(next) === JSON.stringify(current.current)) return;
    const previous = current.current;
    setPast((items) => [...items.slice(-49), previous]);
    setFuture([]);
    current.current = next;
    setFrame(next);
    setNotice("");
  }
  function edit(action: (document: StudioDocument) => StudioDocument) {
    try {
      change(action(current.current.document));
      setError("");
    } catch {
      setError(
        "문서의 편집 한도를 초과했습니다. 페이지나 내용을 줄인 후 다시 시도해 주세요.",
      );
    }
  }
  function selectSection(id: string, scroll = false) {
    setSectionId(id);
    setNodeId(undefined);
    if (scroll)
      window.document
        .getElementById(`studio-page-${id}`)
        ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }
  function insertSection(layout: string) {
    edit((document) => {
      const result = addSection(document, sectionId, layout);
      setSectionId(result.sectionId);
      setNodeId(undefined);
      return result.document;
    });
  }
  function insertText(style: string) {
    edit((document) => {
      const result = addText(document, sectionId, style);
      setSectionId(
        document.root.find((item) => item.id === sectionId)?.id ??
          document.root[0]?.id,
      );
      setNodeId(result.nodeId);
      return result.document;
    });
  }
  function insertImage(imageId: string) {
    edit((document) => {
      if (nodeId && findNode(document, nodeId)?.tag === "img")
        return replaceImage(document, nodeId, imageId);
      const pageId =
        document.root.find((node) => node.id === sectionId)?.id ??
        document.root[0]?.id;
      const id = `studio-${crypto.randomUUID()}`;
      const next = {
        ...document,
        root: document.root.map((node) =>
          node.id === pageId
            ? {
                ...node,
                children: [
                  ...(node.children ?? []),
                  {
                    id,
                    type: "element" as const,
                    tag: "img",
                    props: {
                      imageId,
                      alt: product?.title ?? "작품 사진",
                      style: { width: "100%", height: "auto" },
                    },
                  },
                ],
              }
            : node,
        ),
      };
      parseDocument(next);
      setSectionId(pageId);
      setNodeId(id);
      return next;
    });
  }
  function history(direction: "undo" | "redo") {
    const source = direction === "undo" ? past : future;
    const next = direction === "undo" ? source.at(-1) : source[0];
    if (!next || blocked) return;
    if (direction === "undo") {
      setPast(past.slice(0, -1));
      setFuture([current.current, ...future]);
    } else {
      setPast([...past, current.current]);
      setFuture(future.slice(1));
    }
    current.current = next;
    setFrame(next);
    setNodeId(undefined);
    setNotice("");
  }
  async function save() {
    if (blocked || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const snapshot = { ...current.current, review };
    try {
      await onSave(snapshot);
      setSaved(JSON.stringify(current.current));
      setNotice("임시 저장되었습니다");
    } catch (cause) {
      setError(
        `${cause instanceof Error ? cause.message : "저장하지 못했습니다."} 편집 내용은 유지됩니다.`,
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function chooseFiles(replaceId?: string) {
    replacingPhoto.current = replaceId;
    if (fileInput.current) {
      fileInput.current.multiple = !replaceId;
      fileInput.current.click();
    }
  }
  async function upload(files: File[]) {
    if (!files.length || blocked || busyRef.current) return;
    const replaceId = replacingPhoto.current;
    const batch = replaceId ? files.slice(0, 1) : files;
    if (
      batch.some(
        (file) =>
          !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          file.size > 10 * 1024 * 1024,
      )
    ) {
      setError("JPG·PNG·WebP 사진을 10MB 이내로 선택해 주세요.");
      return;
    }
    if (
      !replaceId &&
      Object.keys(current.current.images).length + batch.length > 32
    ) {
      setError("편집 사진은 최대 32장까지 추가할 수 있습니다.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      for (const file of batch) {
        const asset = await onUpload(file);
        const images = {
          ...current.current.images,
          [asset.imageId]: asset.url,
        };
        let document = current.current.document;
        if (replaceId) {
          const original = findNode(document, replaceId);
          const oldId = original?.props?.imageId;
          const oldSrc = original?.props?.src;
          const replace = (nodes: DocumentNode[]): DocumentNode[] =>
            nodes.map((node) => {
              if (
                node.tag === "img" &&
                (oldId
                  ? node.props?.imageId === oldId
                  : oldSrc
                    ? node.props?.src === oldSrc
                    : node.id === replaceId)
              ) {
                const props = { ...node.props, imageId: asset.imageId };
                delete props.src;
                return { ...node, props };
              }
              return node.children
                ? { ...node, children: replace(node.children) }
                : node;
            });
          document = { ...document, root: replace(document.root) };
          if (oldId) delete images[oldId];
        }
        busyRef.current = false;
        change(document, images);
        busyRef.current = true;
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "사진을 업로드하지 못했습니다.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
      replacingPhoto.current = undefined;
    }
  }
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  useEffect(() => {
    runtime.setNavigationGuard?.(() => {
      if (busyRef.current) {
        setError("사진 준비나 저장이 끝난 후 이동해 주세요.");
        return false;
      }
      if (!dirty) return true;
      if (onPersist) {
        const ok = onPersist({ ...current.current, review });
        if (!ok)
          setError("브라우저에 저장하지 못했습니다. 편집 내용은 유지됩니다.");
        return ok;
      }
      return window.confirm("저장하지 않은 변경이 있습니다. 이동할까요?");
    });
    return () => runtime.setNavigationGuard?.(null);
  }, [runtime, dirty, review, onPersist]);
  useEffect(() => {
    if (!nodeId || review) return;
    const positionToolbar = () => {
      const element = Array.from(
        canvas.current?.querySelectorAll<HTMLElement>("[data-node-id]") ?? [],
      ).find((node) => node.dataset.nodeId === nodeId);
      if (!element) {
        setPosition(undefined);
        return;
      }
      const rect = element.getBoundingClientRect();
      const isImage = selected?.tag === "img";
      const paper = element.closest(".ss-page-paper")?.getBoundingClientRect();
      const wideImage = isImage && (!paper || rect.width > paper.width * 0.75);
      const width = isImage ? (wideImage ? 468 : 292) : 410;
      const left =
        isImage && !wideImage && paper
          ? rect.left + rect.width / 2 < paper.left + paper.width / 2
            ? rect.right + 8
            : rect.left - width - 8
          : rect.left;
      const desiredTop = isImage
        ? wideImage
          ? rect.bottom + 12
          : rect.top
        : rect.top - 40;
      const panelHeight = isImage
        ? (imageOptions.current?.offsetHeight ?? 400)
        : 36;
      setPosition({
        position: "fixed",
        left: Math.max(
          expanded ? 16 : 278,
          Math.min(left, window.innerWidth - width - 16),
        ),
        // 보통은 Figma의 8/12px 간격. 마지막 페이지·작은 창에서는 버튼이 화면을 벗어나지 않게 보정한다.
        top: Math.max(
          80,
          Math.min(desiredTop, window.innerHeight - panelHeight - 12),
        ),
        width: isImage ? width : undefined,
        visibility:
          rect.bottom < 70 || rect.top > window.innerHeight
            ? "hidden"
            : "visible",
      });
    };
    positionToolbar();
    window.addEventListener("resize", positionToolbar);
    window.addEventListener("scroll", positionToolbar, true);
    return () => {
      window.removeEventListener("resize", positionToolbar);
      window.removeEventListener("scroll", positionToolbar, true);
    };
  }, [nodeId, frame.document, frame.images, review, selected?.tag, expanded]);
  const saveButton = (
    <button
      className="ss-button"
      disabled={blocked}
      onClick={() => void save()}
    >
      임시 저장
    </button>
  );
  const completeButton = (
    <button className="ss-button ss-primary" disabled>
      제작 완료
    </button>
  );
  return (
    <div className={`sd-studio ${review ? "sd-review" : ""}`}>
      {error && (
        <p className="ss-global-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <div className="sd-toast">
          <Toast>{notice}</Toast>
        </div>
      )}
      {busy && (
        <p className="sd-busy" role="status">
          처리 중입니다.
        </p>
      )}
      {review ? (
        <>
          <header className="ss-review-header">
            <span className="ss-logo" role="img" aria-label="미담">
              <Logo />
            </span>
            <button aria-label="뒤로가기" onClick={() => setReview(false)}>
              ‹ 뒤로가기
            </button>
            <nav className="ss-devices" aria-label="미리보기 기기">
              {[774, 600, 360].map((width, index) => (
                <button
                  key={width}
                  aria-pressed={device === width}
                  onClick={() => setDevice(width)}
                >
                  {["PC", "태블릿", "모바일"][index]}
                </button>
              ))}
            </nav>
            <div className="ss-review-actions">
              {saveButton}
              {completeButton}
            </div>
          </header>
          <ServerStudioReview
            productId={productId}
            product={product}
            document={frame.document}
            images={frame.images}
            width={device}
            fitCanvas
          />
        </>
      ) : (
        <div className={`ss-editor ${expanded ? "is-expanded" : ""}`}>
          <h1 className="sr-only">상세페이지 편집</h1>
          <nav className="ss-tools" aria-label="편집 도구">
            <div>
              {[
                ["pages", "페이지 목록", "layers"],
                ["layouts", "페이지 추가", "add"],
                ["text", "텍스트 추가", "text"],
                ["images", "사진 추가", "image"],
              ].map(([id, label, icon]) => (
                <Tool
                  key={id}
                  label={label}
                  icon={icon}
                  aria-pressed={panel === id}
                  onClick={() => setPanel(id)}
                />
              ))}
            </div>
            <div className="sd-history">
              <Tool
                label="실행 취소"
                icon="undo"
                disabled={!past.length || blocked}
                onClick={() => history("undo")}
              />
              <Tool
                label="다시 실행"
                icon="redo"
                disabled={!future.length || blocked}
                onClick={() => history("redo")}
              />
            </div>
          </nav>
          <aside className="ss-page-list" aria-label="편집 패널">
            {panel === "pages" &&
              frame.document.root.map((section, index) => (
                <div
                  className="sd-page-row"
                  key={section.id}
                  draggable={!blocked}
                  onDragStart={(event) => {
                    dragId.current = section.id;
                    event.dataTransfer.setData("text/plain", section.id);
                    selectSection(section.id);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = dragId.current;
                    if (id)
                      edit((document) => moveSection(document, id, index));
                    dragId.current = undefined;
                  }}
                >
                  <button
                    aria-pressed={sectionId === section.id}
                    onClick={() => selectSection(section.id, true)}
                    title={sectionTitle(section)}
                  >
                    <Icon name="drag" />
                    <span>
                      {String(index + 1).padStart(2, "0")}.{" "}
                      {sectionTitle(section)}
                    </span>
                  </button>
                  <button
                    aria-label={`페이지 ${index + 1} 삭제`}
                    disabled={blocked || frame.document.root.length < 2}
                    onClick={() => setDeleting(section.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            {panel === "layouts" && (
              <div className="sd-layout-panel">
                <button
                  className="ss-button"
                  disabled={blocked}
                  onClick={() => insertSection("text")}
                >
                  새 영역 추가
                </button>
                <p className="sd-layout-caption">기본 레이아웃 스타일</p>
                <div className="sd-layout-grid">
                  {PAGE_LAYOUTS.map((layout) => (
                    <button
                      disabled={blocked}
                      key={layout.id}
                      onClick={() => insertSection(layout.id)}
                    >
                      <span
                        className={`sd-layout-thumbnail layout-${layout.id}`}
                        aria-hidden="true"
                      >
                        {layout.id.startsWith("text") && (
                          <span className="sd-layout-lines">
                            <i />
                            <i />
                            <i />
                          </span>
                        )}
                        {Array.from(
                          {
                            length: layout.id.startsWith("image")
                              ? Number(layout.id.slice(-1))
                              : layout.id === "text"
                                ? 0
                                : 1,
                          },
                          (_, i) => (
                            <span className="sd-layout-photo" key={i}>
                              <span />
                            </span>
                          ),
                        )}
                      </span>
                      <span>{layout.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {panel === "text" && (
              <div className="sd-text-panel">
                <button
                  className="ss-button"
                  disabled={blocked}
                  onClick={() => insertText("body")}
                >
                  기본 텍스트 박스 추가
                </button>
                {TEXT_STYLES.map(
                  ({ id, label, fontSize, lineHeight, fontWeight }) => (
                    <button
                      disabled={blocked}
                      key={id}
                      style={{ fontSize, lineHeight, fontWeight }}
                      onClick={() => insertText(id)}
                    >
                      {label} 추가
                    </button>
                  ),
                )}
              </div>
            )}
            {panel === "images" && (
              <div className="sd-photo-panel">
                <button
                  className="ss-button"
                  disabled={blocked}
                  onClick={() => chooseFiles()}
                >
                  사진 첨부
                </button>
                <p>
                  사진을 선택하면 선택한 사진을 교체하거나 페이지에 추가합니다.
                </p>
                <div className="ss-image-picker">
                  {Object.entries(frame.images).map(([imageId, url], index) => (
                    <button
                      disabled={blocked}
                      key={imageId}
                      aria-label={`사진 ${index + 1} 사용`}
                      aria-pressed={selected?.props?.imageId === imageId}
                      onClick={() => insertImage(imageId)}
                    >
                      <Image
                        src={url}
                        width={90}
                        height={90}
                        alt={`편집 사진 ${index + 1}`}
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            multiple
            aria-label="편집 사진 첨부"
            accept="image/jpeg,image/png,image/webp"
            disabled={blocked}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              void upload(files);
            }}
          />
          <div className="ss-editor-actions">
            {saveButton}
            {completeButton}
          </div>
          {!editable && (
            <p className="sd-readonly" role="status">
              검수 중이거나 게시된 콘텐츠는 편집할 수 없습니다.
            </p>
          )}
          <div
            className="ss-canvas"
            ref={canvas}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSectionId(undefined);
                setNodeId(undefined);
              }
            }}
          >
            {frame.document.root.map((section, index) => (
              <section
                className={`ss-page ${sectionId === section.id ? "is-selected" : ""}`}
                id={`studio-page-${section.id}`}
                key={section.id}
              >
                <div className="ss-page-bar">
                  <button
                    className="ss-page-title"
                    aria-label={`페이지 ${index + 1} 편집`}
                    onClick={() => selectSection(section.id)}
                  >
                    {index + 1}. {sectionTitle(section)}
                  </button>
                  {sectionId === section.id && (
                    <div className="ss-page-controls">
                      {backgrounds.map(([variant, label, color]) => (
                        <Tool
                          key={variant}
                          label={`${label} 배경`}
                          className={`ss-swatch ${variant}`}
                          disabled={blocked}
                          aria-pressed={
                            normalizeColor(
                              section.props?.style?.backgroundColor ??
                                section.props?.style?.background,
                            ) === color
                          }
                          onClick={() =>
                            edit((document) =>
                              setSectionBackground(document, section.id, color),
                            )
                          }
                        />
                      ))}
                      <Tool
                        label="페이지 위로 이동"
                        icon="up"
                        disabled={blocked || index === 0}
                        onClick={() =>
                          edit((document) =>
                            moveSection(document, section.id, index - 1),
                          )
                        }
                      />
                      <Tool
                        label="페이지 아래로 이동"
                        icon="down"
                        disabled={
                          blocked || index === frame.document.root.length - 1
                        }
                        onClick={() =>
                          edit((document) =>
                            moveSection(document, section.id, index + 1),
                          )
                        }
                      />
                      <Tool
                        label="페이지 복제"
                        icon="duplicate"
                        disabled={blocked}
                        onClick={() =>
                          edit((document) => {
                            const result = duplicateSection(
                              document,
                              section.id,
                            );
                            setSectionId(result.sectionId);
                            setNodeId(undefined);
                            return result.document;
                          })
                        }
                      />
                      <Tool
                        label="페이지 삭제"
                        icon="trash"
                        disabled={blocked || frame.document.root.length < 2}
                        onClick={() => setDeleting(section.id)}
                      />
                    </div>
                  )}
                </div>
                <div
                  className="ss-page-paper"
                  onClick={() => selectSection(section.id)}
                >
                  <ServerDocument
                    document={{ ...frame.document, root: [section] }}
                    images={frame.images}
                    fitCanvas
                    onPendingText={setPendingText}
                    selectedNodeId={nodeId}
                    onSelectNode={
                      editable && !busy
                        ? (id) => {
                            setSectionId(section.id);
                            setNodeId(id);
                          }
                        : undefined
                    }
                    onChangeText={
                      editable && !busy
                        ? (id, text) =>
                            edit((document) => updateText(document, id, text))
                        : undefined
                    }
                  />
                </div>
              </section>
            ))}
          </div>
          {selected?.type === "text" && !blocked && (
            <div
              className="sd-node-toolbar sd-text-toolbar"
              style={position}
              role="toolbar"
              aria-label="텍스트 서식"
            >
              <select
                aria-label="글꼴 크기"
                value={selectedTextStyle.id}
                onChange={(event) => {
                  const style = TEXT_STYLES.find(
                    (item) => item.id === event.target.value,
                  )!;
                  edit((document) =>
                    styleText(document, selected.id, {
                      fontSize: style.fontSize,
                      lineHeight: style.lineHeight,
                      fontWeight: style.fontWeight,
                    }),
                  );
                }}
              >
                {TEXT_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
              {(["left", "center", "right"] as const).map((align, i) => (
                <Tool
                  key={align}
                  label={["왼쪽 정렬", "가운데 정렬", "오른쪽 정렬"][i]}
                  icon={`align-${align}`}
                  aria-pressed={(selectedStyle.textAlign ?? "left") === align}
                  onClick={() =>
                    edit((document) =>
                      styleText(document, selected.id, { textAlign: align }),
                    )
                  }
                />
              ))}
              <Tool
                label="굵게"
                icon="bold"
                aria-pressed={
                  Number(selectedStyle.fontWeight) >= 600 ||
                  selectedStyle.fontWeight === "bold"
                }
                onClick={() =>
                  edit((document) =>
                    styleText(document, selected.id, {
                      fontWeight:
                        Number(selectedStyle.fontWeight) >= 600 ||
                        selectedStyle.fontWeight === "bold"
                          ? 400
                          : 600,
                    }),
                  )
                }
              />
              {colors.map(([color, label]) => (
                <Tool
                  key={color}
                  label={`${label} 글자색`}
                  className="sd-text-color"
                  style={{ backgroundColor: color }}
                  aria-pressed={normalizeColor(selectedStyle.color) === color}
                  onClick={() =>
                    edit((document) =>
                      styleText(document, selected.id, { color }),
                    )
                  }
                />
              ))}
              <Tool
                label="텍스트 삭제"
                icon="trash"
                onClick={() => {
                  edit((document) => deleteNode(document, selected.id));
                  setNodeId(undefined);
                }}
              />
            </div>
          )}
          {selected?.tag === "img" && !blocked && (
            <div
              className="sd-image-options"
              ref={imageOptions}
              style={position}
              role="region"
              aria-label="사진 편집"
            >
              <div className="sd-image-options-grid">
                {Object.entries(frame.images).map(([imageId, url], index) => (
                  <button
                    key={imageId}
                    aria-label={`사진 ${index + 1}로 교체`}
                    aria-pressed={selected.props?.imageId === imageId}
                    onClick={() => insertImage(imageId)}
                  >
                    <Image
                      src={url}
                      width={80}
                      height={80}
                      alt={`편집 사진 ${index + 1}`}
                      unoptimized
                    />
                  </button>
                ))}
                <button className="sd-add-photo" onClick={() => chooseFiles()}>
                  <Image
                    src="/seller-figma/plus.svg"
                    width={16}
                    height={16}
                    alt=""
                  />
                  <span>사진 첨부하기</span>
                </button>
              </div>
              <button
                className="ss-button"
                onClick={() => chooseFiles(selected.id)}
              >
                선택 사진 교체
              </button>
              <p className="sd-image-replace-hint">
                교체하면 이 사진을 사용한 모든 페이지에 반영됩니다.
              </p>
              <button
                className="ss-button"
                onClick={() => {
                  edit((document) => deleteNode(document, selected.id));
                  setNodeId(undefined);
                }}
              >
                이미지 삭제하기
              </button>
            </div>
          )}
          <div className="sd-view-tools">
            <Tool
              label="미리보기"
              icon="expand"
              disabled={busy}
              onClick={() => {
                setReview(true);
                setNodeId(undefined);
              }}
            />
            <button
              aria-label={expanded ? "편집 도구 펼치기" : "편집 도구 접기"}
              data-tooltip={expanded ? "편집 도구 펼치기" : "편집 도구 접기"}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "›" : "‹"}
            </button>
          </div>
          <StudioHelp mvp step={helpStep} onStepChange={setHelpStep} />
        </div>
      )}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        title="해당 내용을 삭제할까요?"
        variant="confirmation"
        className="sd-delete-dialog"
      >
        <div className="sd-delete-actions">
          <button className="ss-button" onClick={() => setDeleting(undefined)}>
            취소
          </button>
          <button
            className="ss-button ss-primary"
            onClick={() => {
              if (deleting) edit((document) => deleteNode(document, deleting));
              setDeleting(undefined);
              setNodeId(undefined);
              setSectionId(undefined);
            }}
          >
            삭제
          </button>
        </div>
      </Dialog>
    </div>
  );
}
