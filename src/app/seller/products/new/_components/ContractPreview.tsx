"use client";
import Image from "next/image";
import type { CSSProperties } from "react";
import { createElement, useEffect, useRef, useState } from "react";

import type {
  ContractDocument,
  ContractNode,
  StudioAsset,
} from "./studio-contract";
import { parseContract } from "./studio-contract";

interface ContractPreviewProps {
  document: ContractDocument;
  assets: StudioAsset[];
  mobile?: boolean;
  selected?: string;
}
export function ContractPreview({
  document,
  assets,
  mobile,
  selected,
}: ContractPreviewProps) {
  const host = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 530, height: 2000 });
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (host.current && content.current)
        setSize({
          width: host.current.clientWidth,
          height: content.current.scrollHeight,
        });
    });
    if (host.current) observer.observe(host.current);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);
  let validated: ContractDocument;
  try {
    validated = parseContract(document, assets);
  } catch {
    return (
      <div className="cs-error" role="alert">
        미리보기를 표시할 수 없습니다. 문서 형식과 이미지 참조를 확인해 주세요.
      </div>
    );
  }
  const scale = Math.min(1, size.width / validated.canvasWidth);
  function render(node: ContractNode): React.ReactNode {
    if (node.type === "text") return node.value;
    if (node.tag === "img") {
      const asset = assets.find(
        (item) => item.imageId === node.props?.imageId,
      )!;
      return (
        <div className="cs-photo" key={node.id}>
          <Image
            src={asset.url}
            width={asset.width}
            height={asset.height}
            alt={node.props?.alt ?? asset.alt}
            unoptimized
          />
          {(asset.product_generated ||
            asset.asset_mode.startsWith("generated")) && (
            <span>AI 생성 참고용</span>
          )}
        </div>
      );
    }
    const safe = node.props?.style;
    const style: CSSProperties = safe
      ? {
          color: safe.color,
          backgroundColor: safe.backgroundColor,
          fontSize: safe.fontSize,
          fontWeight: safe.fontWeight,
          textAlign: safe.textAlign,
          ...(safe.padding
            ? {
                padding: `${safe.padding.top}px ${safe.padding.right}px ${safe.padding.bottom}px ${safe.padding.left}px`,
              }
            : {}),
        }
      : {};
    const layout = node.props?.layout;
    if (layout?.display === "grid")
      Object.assign(style, {
        display: "grid",
        gridTemplateColumns: `repeat(${layout.columns},minmax(0,1fr))`,
        gap: layout.gap,
      });
    if (layout?.display === "flex")
      Object.assign(style, {
        display: "flex",
        flexDirection: layout.direction,
        flexWrap: layout.wrap ? "wrap" : "nowrap",
        alignItems: layout.align,
        gap: layout.gap,
      });
    if (layout?.display === "stack")
      Object.assign(style, {
        display: "flex",
        flexDirection: "column",
        alignItems: layout.align,
        gap: layout.gap,
      });
    return createElement(
      node.tag,
      {
        key: node.id,
        style,
        "data-section": node.tag === "section" ? node.id : undefined,
        className: `${node.props?.variant ? `cs-paper-${node.props.variant}` : ""} ${node.id === `section-${selected}` ? "cs-section-selected" : ""}`,
      },
      node.children?.map(render),
    );
  }
  return (
    <div className={`cs-preview-host ${mobile ? "is-mobile" : ""}`} ref={host}>
      <div style={{ height: size.height * scale }}>
        <article
          ref={content}
          aria-label="상세페이지 미리보기"
          className="cs-document"
          style={{ width: validated.canvasWidth, transform: `scale(${scale})` }}
        >
          {validated.root.map(render)}
        </article>
      </div>
    </div>
  );
}
