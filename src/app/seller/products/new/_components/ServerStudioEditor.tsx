"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { uploadPublicImage } from "@/api/images/api";
import {
  changeContentStatus,
  getContent,
  saveContent,
  type SellerContent,
} from "@/api/seller-studio/api";
import { useSellerMutation } from "@/queries/seller-studio/queries";
import {
  editNode,
  flattenDocument,
  imageReferences,
  patchesBetween,
  safeImageUrl,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import { ServerDocument } from "./ServerDocument";

export function ServerStudioEditor({ content }: { content: SellerContent }) {
  const [baseline, setBaseline] = useState(content.reactDocument);
  const [document, setDocument] = useState(content.reactDocument);
  const [status, setStatus] = useState(content.status);
  const [past, setPast] = useState<StudioDocument[]>([]);
  const [future, setFuture] = useState<StudioDocument[]>([]);
  const [review, setReview] = useState(false);
  const [width, setWidth] = useState(774);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [checks, setChecks] = useState({
    factCheckConfirmed: false,
    photoMatchConfirmed: false,
    displayApprovalBadge: false,
  });
  const [images, setImages] = useState<Record<string, string>>({});
  const urls = useRef<string[]>([]);
  useEffect(
    () => () => urls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  const patches = patchesBetween(baseline, document);
  const dirty = patches.length > 0;
  const editable = status === "DRAFT" || status === "REJECTED";
  const busyRef = useRef(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const mutation = useSellerMutation(async (action: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await action();
    } finally {
      busyRef.current = false;
    }
  });
  const run = (action: () => Promise<void>) => {
    setError("");
    setNotice("");
    void mutation
      .mutateAsync(action)
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "처리하지 못했습니다. 다시 시도해 주세요.",
        ),
      );
  };
  const change = (next: StudioDocument) => {
    setPast([...past.slice(-49), document]);
    setFuture([]);
    setDocument(next);
    setNotice("");
  };
  async function save() {
    if (!patches.length) return;
    const result = await saveContent(
      content.productId,
      content.contentId,
      patches,
    );
    setBaseline(document);
    setStatus(result.status);
    setNotice("서버에 저장했습니다.");
  }
  async function transition(
    action: "submit" | "approve" | "reject" | "publish",
  ) {
    if (action === "submit") await save();
    const result = await changeContentStatus(
      content.productId,
      content.contentId,
      action,
      action === "approve" ? checks : undefined,
    );
    setStatus(result.status);
    setNotice(
      action === "publish"
        ? "콘텐츠 게시 요청이 완료되었습니다. 상품 판매 상태와 공개 화면 반영은 내 상품에서 확인해 주세요."
        : "서버에 반영했습니다.",
    );
  }
  const texts = flattenDocument(document).filter(
    (node) => node.type === "text",
  );
  const photos = flattenDocument(document).filter((node) => node.tag === "img");
  const resolvedImages = {
    ...imageReferences(
      (content.blocks ?? []).flatMap((block) =>
        (block.imageVariants ?? []).map((variant) => variant.url),
      ),
      photos.flatMap((node) =>
        node.props?.imageId ? [node.props.imageId] : [],
      ),
    ),
    ...images,
  };
  // ID가 URL인 응답만 직접 연결한다. 순서만 같은 blocks를 다른 이미지 ID에 붙이지 않는다.
  for (const node of photos) {
    const source = safeImageUrl(node.props?.imageId);
    if (source) resolvedImages[node.props!.imageId!] = source;
  }
  return (
    <div className="sa-editor">
      <header className="sa-toolbar">
        <h1>{review ? "최종 확인" : "상세페이지 편집"}</h1>
        <span>{status}</span>
        <button
          disabled={mutation.isPending || !past.length || !editable}
          onClick={() => {
            const prev = past.at(-1)!;
            setFuture([document, ...future]);
            setPast(past.slice(0, -1));
            setDocument(prev);
          }}
        >
          실행 취소
        </button>
        <button
          disabled={mutation.isPending || !future.length || !editable}
          onClick={() => {
            setPast([...past, document]);
            setDocument(future[0]!);
            setFuture(future.slice(1));
          }}
        >
          다시 실행
        </button>
        <button
          disabled={mutation.isPending || !dirty || !editable}
          onClick={() => run(save)}
        >
          서버에 저장
        </button>
        <button
          disabled={mutation.isPending}
          onClick={() => setReview(!review)}
        >
          {review ? "편집으로 돌아가기" : "최종 확인"}
        </button>
      </header>
      {error && (
        <p role="alert" className="ss-global-error">
          {error} 편집 내용은 유지됩니다.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <p className="sa-note">
        글과 사진을 수정할 수 있습니다. 배치·서식은 AI가 만든 구성을 유지합니다.
      </p>
      <div className="sa-editor-grid">
        {!review && (
          <aside className="sa-controls">
            <fieldset disabled={!editable || mutation.isPending}>
              {texts.map((node, index) => (
                <label key={node.id}>
                  문구 {index + 1}
                  <textarea
                    aria-label={`문구 ${index + 1}`}
                    value={node.value}
                    rows={3}
                    maxLength={50000}
                    onChange={(event) =>
                      change(
                        editNode(document, node.id, {
                          text: event.target.value,
                        }),
                      )
                    }
                  />
                </label>
              ))}
              {photos.map((node, index) => (
                <label key={node.id}>
                  사진 {index + 1} 교체
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      if (
                        !["image/jpeg", "image/png", "image/webp"].includes(
                          file.type,
                        ) ||
                        file.size > 10 * 1024 * 1024
                      ) {
                        setError(
                          "JPG·PNG·WebP 사진을 10MB 이내로 선택해 주세요.",
                        );
                        return;
                      }
                      run(async () => {
                        const imageId = await uploadPublicImage(
                          file,
                          "CONTENT",
                        );
                        const url = URL.createObjectURL(file);
                        urls.current.push(url);
                        setImages((prev) => ({ ...prev, [imageId]: url }));
                        change(editNode(document, node.id, { imageId }));
                      });
                    }}
                  />
                </label>
              ))}
            </fieldset>
            <p>
              이미지 주소가 응답에 없으면 기본 안내가 표시됩니다. 교체한 사진의
              공개 조회 정보는 백엔드 반영이 필요할 수 있습니다.
            </p>
          </aside>
        )}
        <div className="sa-preview">
          <nav aria-label="미리보기 크기">
            {[774, 600, 360].map((size, index) => (
              <button
                key={size}
                aria-pressed={width === size}
                onClick={() => setWidth(size)}
              >
                {["PC", "태블릿", "모바일"][index]}
              </button>
            ))}
          </nav>
          <div style={{ width: `min(100%, ${width}px)` }}>
            <ServerDocument document={document} images={resolvedImages} />
          </div>
        </div>
      </div>
      {review && (
        <section className="sa-review" aria-label="검수 및 게시">
          <h2>검수 및 게시</h2>
          {editable && (
            <button
              disabled={mutation.isPending}
              onClick={() => run(() => transition("submit"))}
            >
              저장하고 검수 요청
            </button>
          )}
          {status === "PENDING_REVIEW" && (
            <>
              <fieldset disabled={mutation.isPending}>
                <label>
                  <input
                    type="checkbox"
                    checked={checks.factCheckConfirmed}
                    onChange={(event) =>
                      setChecks({
                        ...checks,
                        factCheckConfirmed: event.target.checked,
                      })
                    }
                  />
                  내용이 사실과 일치합니다.
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checks.photoMatchConfirmed}
                    onChange={(event) =>
                      setChecks({
                        ...checks,
                        photoMatchConfirmed: event.target.checked,
                      })
                    }
                  />
                  사진이 실제 작품과 일치합니다.
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checks.displayApprovalBadge}
                    onChange={(event) =>
                      setChecks({
                        ...checks,
                        displayApprovalBadge: event.target.checked,
                      })
                    }
                  />
                  확인 배지를 표시합니다.
                </label>
              </fieldset>
              <button
                disabled={
                  mutation.isPending ||
                  !checks.factCheckConfirmed ||
                  !checks.photoMatchConfirmed
                }
                onClick={() => run(() => transition("approve"))}
              >
                확인하고 승인
              </button>
              <button
                disabled={mutation.isPending}
                onClick={() => run(() => transition("reject"))}
              >
                수정하기 위해 반려
              </button>
            </>
          )}
          {status === "APPROVED" && (
            <button
              disabled={mutation.isPending}
              onClick={() => run(() => transition("publish"))}
            >
              콘텐츠 게시
            </button>
          )}
          {status === "PUBLISHED" && (
            <p>
              콘텐츠 게시 상태입니다. 상품의 판매 상태는 별도로 확인해 주세요.
            </p>
          )}
          <Link
            href="/seller/products"
            onClick={(event) => {
              if (
                (dirty || mutation.isPending) &&
                !window.confirm(
                  "저장하지 않은 변경이 있습니다. 목록으로 이동할까요?",
                )
              )
                event.preventDefault();
            }}
          >
            내 상품으로
          </Link>
        </section>
      )}
      <button
        disabled={mutation.isPending || dirty}
        onClick={() =>
          run(async () => {
            const latest = await getContent(content.productId);
            setDocument(latest.reactDocument);
            setBaseline(latest.reactDocument);
            setStatus(latest.status);
            setPast([]);
            setFuture([]);
            setNotice("서버 문서를 다시 불러왔습니다.");
          })
        }
      >
        서버 문서 다시 조회
      </button>
    </div>
  );
}
