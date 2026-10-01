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
}: {
  document: StudioDocument;
  images: Record<string, string>;
  fitCanvas?: boolean;
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
    if (!node) return;
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
