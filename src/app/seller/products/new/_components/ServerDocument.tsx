"use client";
import Image from "next/image";
import {
  createElement,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type DocumentNode,
  safeImageUrl,
  type StudioDocument,
} from "@/utils/seller-studio/document";

export function ServerDocument({
  document,
  images,
  fitCanvas = false,
  selectedNodeId,
  onSelectNode,
  onChangeText,
  onPendingText,
}: {
  document: StudioDocument;
  images: Record<string, string>;
  fitCanvas?: boolean;
  selectedNodeId?: string;
  onSelectNode?: (id: string) => void;
  onChangeText?: (id: string, text: string) => void;
  onPendingText?: (pending: boolean) => void;
}) {
  function render(node: DocumentNode): ReactNode {
    if (node.type === "text")
      return onSelectNode ? (
        <span
          key={node.id}
          data-node-id={node.id}
          className={`sd-editable-text ${selectedNodeId === node.id ? "is-selected" : ""}`}
          role="textbox"
          aria-label="텍스트 편집"
          tabIndex={0}
          contentEditable={!!onChangeText}
          suppressContentEditableWarning
          onClick={(event) => {
            event.stopPropagation();
            onSelectNode(node.id);
          }}
          onFocus={() => onSelectNode(node.id)}
          onInput={() => onPendingText?.(true)}
          onBlur={(event) => {
            const value =
              event.currentTarget.innerText ??
              event.currentTarget.textContent ??
              "";
            onPendingText?.(false);
            if (value !== node.value) onChangeText?.(node.id, value);
          }}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            const selection = window.getSelection();
            if (!selection?.rangeCount) return;
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const pasted = window.document.createTextNode(text);
            range.insertNode(pasted);
            range.setStartAfter(pasted);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            onPendingText?.(true);
          }}
        >
          {node.value}
        </span>
      ) : node.value?.includes("\n") ? (
        <span key={node.id} style={{ whiteSpace: "pre-wrap" }}>
          {node.value}
        </span>
      ) : (
        node.value
      );
    if (node.tag === "img") {
      const source =
        images[node.props?.imageId ?? ""] ??
        safeImageUrl(node.props?.src) ??
        safeImageUrl(node.props?.imageId);
      return source ? (
        <DocumentImage
          key={node.id + ":" + source}
          src={source}
          alt={node.props?.alt ?? "작품 사진"}
          style={node.props?.style}
          nodeId={onSelectNode ? node.id : undefined}
          selected={selectedNodeId === node.id}
          onSelect={onSelectNode ? () => onSelectNode(node.id) : undefined}
        />
      ) : (
        <div
          key={node.id}
          className="sa-image-missing"
          data-node-id={node.id}
          role={onSelectNode ? "button" : undefined}
          tabIndex={onSelectNode ? 0 : undefined}
          aria-label={onSelectNode ? "빈 사진 선택" : undefined}
          onClick={(event) => {
            event.stopPropagation();
            onSelectNode?.(node.id);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectNode?.(node.id);
            }
          }}
        >
          이미지를 불러올 수 없습니다.
        </div>
      );
    }
    return createElement(
      node.tag!,
      { key: node.id, style: node.props?.style },
      node.tag === "br" ? undefined : node.children?.map(render),
    );
  }
  const result = (
    <div className="sa-document" style={{ maxWidth: document.canvasWidth }}>
      {document.root.map(render)}
    </div>
  );
  return fitCanvas ? (
    <DocumentCanvas width={document.canvasWidth}>{result}</DocumentCanvas>
  ) : (
    result
  );
}

function DocumentImage({
  src,
  alt,
  style,
  nodeId,
  selected,
  onSelect,
}: {
  src: string;
  alt: string;
  style?: CSSProperties;
  nodeId?: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div
        className="sa-image-missing"
        data-node-id={nodeId}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        aria-label={onSelect ? "불러오지 못한 사진 선택" : undefined}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.();
        }}
        onKeyDown={(event) => {
          if (onSelect && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        {alt} · 이미지를 불러올 수 없습니다.
      </div>
    );
  return (
    <Image
      src={src}
      alt={alt}
      width={774}
      height={774}
      unoptimized
      data-node-id={nodeId}
      className={
        onSelect
          ? `sd-editable-image ${selected ? "is-selected" : ""}`
          : undefined
      }
      tabIndex={onSelect ? 0 : undefined}
      onClick={(event) => {
        if (onSelect) {
          event.stopPropagation();
          onSelect();
        }
      }}
      onKeyDown={(event) => {
        if (onSelect && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect();
        }
      }}
      style={{ width: "100%", height: "auto", ...style }}
      onError={() => setFailed(true)}
    />
  );
}

function DocumentCanvas({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const node = frame.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() =>
      setScale(Math.min(1, node.clientWidth / width)),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={frame} style={{ width: "100%", maxWidth: width }}>
      <div className="sa-document-canvas" style={{ width, zoom: scale }}>
        {children}
      </div>
    </div>
  );
}
