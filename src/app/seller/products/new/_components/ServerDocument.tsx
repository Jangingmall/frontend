"use client";
import Image from "next/image";
import {
  createElement,
  type CSSProperties,
  type ReactNode,
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
}: {
  document: StudioDocument;
  images: Record<string, string>;
}) {
  function render(node: DocumentNode): ReactNode {
    if (node.type === "text") return node.value;
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
        />
      ) : (
        <div key={node.id} className="sa-image-missing">
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
  return (
    <div className="sa-document" style={{ maxWidth: document.canvasWidth }}>
      {document.root.map(render)}
    </div>
  );
}

function DocumentImage({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="sa-image-missing">
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
      style={{ width: "100%", height: "auto", ...style }}
      onError={() => setFailed(true)}
    />
  );
}
