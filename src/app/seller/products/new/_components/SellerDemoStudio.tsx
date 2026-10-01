"use client";
import "./seller-demo.css";

import { useEffect, useState } from "react";

import { createSellerDemoRuntime } from "@/api/seller-demo/client";
import {
  type SellerDemoId,
  sellerDemoScenarios,
} from "@/api/seller-demo/scenarios";
import { Logo } from "@/components/ui/logo";
import {
  type SellerStudioRuntime,
  SellerStudioRuntimeContext,
} from "@/queries/seller-studio/runtime";

import { demoStorageKey } from "./demo-editor-document";
import { DemoFrontendEditor } from "./DemoFrontendEditor";
import {
  type DemoDocumentSnapshot,
  parseDemoDocumentSnapshot,
} from "./document-editor-storage";
import { ServerSellerStudio } from "./ServerSellerStudio";

export function SellerDemoStudio({ scenario }: { scenario: SellerDemoId }) {
  const [runtime, setRuntime] = useState<SellerStudioRuntime>();
  const [restored, setRestored] = useState<DemoDocumentSnapshot>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const sample = sellerDemoScenarios[scenario];
    void (async () => {
      const response = await fetch(sample.photo, { signal: controller.signal });
      if (!response.ok) throw new Error("시연 사진을 불러오지 못했습니다.");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      if (new URLSearchParams(window.location.search).get("draft") === "1") {
        const raw = localStorage.getItem(demoStorageKey(scenario));
        if (raw) setRestored(parseDemoDocumentSnapshot(raw));
      }
      let navigationGuard: (() => boolean) | null = null;
      setRuntime({
        ...createSellerDemoRuntime(scenario, crypto.randomUUID()),
        setNavigationGuard: (guard) => {
          navigationGuard = guard;
        },
        canNavigate: () => navigationGuard?.() ?? true,
        initialInput: {
          values: {
            productName: sample.name,
            howMade: sample.making,
            careTips: sample.care,
          },
          files: [
            new File(
              [blob],
              sample.name + (blob.type === "image/webp" ? ".webp" : ".png"),
              { type: blob.type },
            ),
          ],
        },
      });
    })().catch((cause) => {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "시연 자료를 불러오지 못했습니다.",
        );
    });
    return () => controller.abort();
  }, [scenario]);
  if (error) return <p role="alert">{error}</p>;
  if (!runtime) return <p role="status">시연 자료를 불러오고 있습니다.</p>;
  return (
    <SellerStudioRuntimeContext value={runtime}>
      <div className="seller-demo">
        {restored ? (
          <div className="ss-shell">
            <header className="ss-header">
              <a
                className="ss-logo"
                href="/seller/products"
                aria-label="판매 관리로 이동"
                onClick={(event) => {
                  if (runtime.canNavigate && !runtime.canNavigate())
                    event.preventDefault();
                }}
              >
                <Logo />
              </a>
              <span>판매 관리</span>
            </header>
            <DemoFrontendEditor restored={restored} />
          </div>
        ) : (
          <ServerSellerStudio />
        )}
      </div>
    </SellerStudioRuntimeContext>
  );
}
