"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ProductPreviewFrameProps {
  children: ReactNode;
  width: number;
}

const FRAME_HTML =
  '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>';

/** 실제 상세페이지의 media query가 선택한 기기 폭을 기준으로 계산되도록 분리한다. */
export function ProductPreviewFrame({
  children,
  width,
}: ProductPreviewFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [target, setTarget] = useState<Document | null>(null);
  useEffect(() => {
    const frameDocument = frame.current?.contentDocument;
    if (!frameDocument) return;
    function syncStyles() {
      frameDocument!.head
        .querySelectorAll("[data-preview-style]")
        .forEach((node) => node.remove());
      document
        .querySelectorAll('link[rel="stylesheet"], style')
        .forEach((node) => {
          const copy = node.cloneNode(true) as HTMLElement;
          copy.setAttribute("data-preview-style", "");
          frameDocument!.head.appendChild(copy);
        });
      frameDocument!.documentElement.className =
        document.documentElement.className.replace(/\bdark\b/g, "");
      frameDocument!.documentElement.style.colorScheme = "light";
      frameDocument!.body.className = "bg-bg-default text-font-dark";
    }
    syncStyles();
    const observer = new MutationObserver(syncStyles);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [target]);
  return (
    <div
      className={`ss-review-device ${width === 600 ? "tablet" : width === 360 ? "mobile" : ""}`}
    >
      <iframe
        ref={frame}
        title="상품 상세페이지 미리보기"
        srcDoc={FRAME_HTML}
        className="ss-product-preview-frame"
        onLoad={() => setTarget(frame.current?.contentDocument ?? null)}
      />
      {target && createPortal(children, target.body)}
    </div>
  );
}
