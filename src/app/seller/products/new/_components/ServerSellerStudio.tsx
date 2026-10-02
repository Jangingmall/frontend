"use client";
import "./seller-api.css";
import "./seller-input.css";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { ChatThinkingIndicator } from "@/components/chatbot/ChatThinkingIndicator";
import { Logo } from "@/components/ui/logo";
import { ApiError } from "@/lib/http/api-error";
import {
  useGeneration,
  useSellerContent,
} from "@/queries/seller-studio/queries";
import {
  SellerStudioRuntimeContext,
  useSellerStudioRuntime,
} from "@/queries/seller-studio/runtime";
import { useAuthStore } from "@/stores/auth";

import { DemoFrontendEditor } from "./DemoFrontendEditor";
import { SellerAccess } from "./SellerAccess";
import { ServerStudioEditor } from "./ServerStudioEditor";
import { ServerStudioInput } from "./ServerStudioInput";
import { StudioSteps } from "./StudioSteps";

function Studio({
  initialProductId,
  initialGenerationId,
}: {
  initialProductId?: number;
  initialGenerationId?: number;
}) {
  const runtime = useSellerStudioRuntime();
  const [productId, setProductId] = useState(initialProductId);
  const [generationId, setGenerationId] = useState(initialGenerationId);
  const [retryInput, setRetryInput] = useState(false);
  const generation = useGeneration(
    productId,
    generationId,
    true,
    useAuthStore((state) => state.user?.id ?? 0),
  );
  const ready = !generationId || generation.data?.status === "COMPLETED";
  const content = useSellerContent(
    productId,
    ready && !retryInput,
    useAuthStore((state) => state.user?.id ?? 0),
  );
  const missing =
    content.error instanceof ApiError && content.error.status === 404;
  const showInput =
    retryInput || !productId || (ready && missing && !content.data);
  return (
    <div className="ss-shell sa-figma">
      <header className="ss-header">
        <Link
          href="/seller/products"
          className="ss-logo"
          aria-label="판매 관리로 이동"
          onClick={(event) => {
            if (runtime.canNavigate && !runtime.canNavigate())
              event.preventDefault();
          }}
        >
          <Logo />
        </Link>
        <span>판매 관리</span>
      </header>
      {showInput ? (
        <main className="ss-form-wrap sa-figma-input">
          <div className="ss-heading">
            <h1>AI 상세페이지 제작</h1>
            <StudioSteps current={0} />
          </div>
          <p className="ss-intro">
            작품 사진과 제작 정보를 입력하면 AI가 상세페이지를 만들어 드립니다.
          </p>
          <ServerStudioInput
            productId={productId}
            onStarted={(pid, gid) => {
              setProductId(pid);
              setGenerationId(gid);
              setRetryInput(false);
              window.history.replaceState(
                null,
                "",
                runtime.studioUrl(pid, gid),
              );
            }}
          />
        </main>
      ) : generationId && !ready ? (
        <main className="ss-form-wrap sa-generating">
          <div className="ss-heading">
            <h1>AI 상세페이지 제작</h1>
            <StudioSteps current={1} />
          </div>
          <div className="sa-generation-message">
            {!generation.isError &&
              generation.data?.status !== "FAILED" &&
              generation.data?.status !== "DRAFT_READY" && (
                <ChatThinkingIndicator variant="dots" />
              )}
            <h2>
              {generation.data?.status === "DRAFT_READY"
                ? "AI 초안 확인이 필요합니다"
                : generation.data?.status === "FAILED"
                  ? "AI 생성에 실패했습니다"
                  : "AI가 상세페이지 초안을 만들고 있어요."}
            </h2>
            {generation.isError ? (
              <div role="alert">
                <p>
                  생성 상태를 조회하지 못했습니다. 같은 작업의 상태를 다시
                  확인해 주세요.
                </p>
                <button onClick={() => void generation.refetch()}>
                  상태 다시 조회
                </button>
              </div>
            ) : generation.data?.status === "DRAFT_READY" ? (
              <div role="status">
                <p>
                  서버가 초안 준비 상태를 반환했습니다. 현재 API에는 이 생성
                  작업의 초안 조회·승인 연결이 없어 편집 화면을 열 수 없습니다.
                  백엔드 연동 확인이 필요합니다.
                </p>
                <button onClick={() => void generation.refetch()}>
                  상태 다시 조회
                </button>
              </div>
            ) : generation.data?.status === "FAILED" ? (
              <button onClick={() => setRetryInput(true)}>
                정보를 확인하고 재생성
              </button>
            ) : (
              <p role="status">잠시만 기다려 주세요.</p>
            )}
          </div>
          <p className="sa-generation-hint">창을 닫지 않고 기다려 주세요.</p>
        </main>
      ) : content.isPending ? (
        <p role="status">생성된 문서를 불러오고 있습니다.</p>
      ) : content.data ? (
        <>
          {content.isError && (
            <p role="alert">
              서버 재조회에 실패했습니다. 편집 내용은 유지됩니다.
            </p>
          )}
          {runtime.demo ? (
            <DemoFrontendEditor
              key={content.data.contentId}
              content={content.data}
            />
          ) : (
            <ServerStudioEditor
              key={content.data.contentId}
              content={content.data}
            />
          )}
        </>
      ) : content.isError ? (
        <main className="ss-form-wrap">
          <h1>문서를 불러오지 못했습니다</h1>
          <p role="alert">
            응답 형식 또는 서버 상태를 확인해 주세요. 예시 데이터로 대체하지
            않습니다.
          </p>
          <button onClick={() => void content.refetch()}>문서 다시 조회</button>
        </main>
      ) : null}
    </div>
  );
}
export function ServerSellerStudio(props: {
  initialProductId?: number;
  initialGenerationId?: number;
}) {
  const runtime = useSellerStudioRuntime();
  const ownerId = useAuthStore((state) => state.user?.id);
  const guard = useRef<(() => boolean) | null>(null);
  const guardedRuntime = useMemo(
    () => ({
      ...runtime,
      setNavigationGuard: (next: (() => boolean) | null) => {
        guard.current = next;
      },
      canNavigate: () => guard.current?.() ?? true,
    }),
    [runtime],
  );
  if (runtime.demo) return <Studio key={runtime.scope} {...props} />;
  return (
    <SellerAccess>
      <SellerStudioRuntimeContext value={guardedRuntime}>
        <Studio key={ownerId} {...props} />
      </SellerStudioRuntimeContext>
    </SellerAccess>
  );
}
