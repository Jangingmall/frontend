"use client";
import "./seller-studio.css";
import "./seller-api.css";
import "./seller-demo.css";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { requestSellerDemo, saveSellerDemo } from "@/api/seller-demo/client";
import {
  type SellerDemoId,
  sellerDemoScenarios,
} from "@/api/seller-demo/scenarios";
import { Logo } from "@/components/ui/logo";
import {
  editNode,
  flattenDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import { ServerDocument } from "./ServerDocument";
import type { StudioAsset, StudioDraft } from "./studio-contract";
import { StudioInput } from "./StudioInput";
import { StudioSteps } from "./StudioSteps";

export function SellerDemoStudio({ scenario }: { scenario: SellerDemoId }) {
  const sample = sellerDemoScenarios[scenario];
  const session = useRef("");
  const [document, setDocument] = useState<StudioDocument | null>(null);
  const [past, setPast] = useState<StudioDocument[]>([]);
  const [future, setFuture] = useState<StudioDocument[]>([]);
  const [selected, setSelected] = useState("");
  const [step, setStep] = useState<
    "input" | "generating" | "editing" | "review"
  >("input");
  const [width, setWidth] = useState(774);
  const preview = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  useEffect(() => {
    const element = preview.current;
    if (!element) return;
    const resize = () =>
      setPreviewScale(Math.min(1, element.clientWidth / 774));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [step]);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState("");
  const [formKey, setFormKey] = useState(0);
  const mutation = useMutation({
    mutationFn: async (task: () => Promise<void>) => task(),
  });
  const run = (task: () => Promise<void>) => {
    setNotice("");
    mutation.reset();
    mutation.mutate(task);
  };
  function generate(draft: StudioDraft, assets: StudioAsset[]) {
    run(async () => {
      setStep("generating");
      session.current = crypto.randomUUID();
      try {
        const [response] = await Promise.all([
          requestSellerDemo(scenario, session.current, "POST", {
            name: draft.product_name,
            making: draft.summary,
            care:
              draft.page_plan.find((p) => p.section_id === "care")?.body ||
              "관리 안내",
            images: assets.map((a) => a.imageId),
          }),
          new Promise((r) => setTimeout(r, 1800)),
        ]);
        setDocument(response.document);
        setSaved(JSON.stringify(response.document));
        setPast([]);
        setFuture([]);
        setSelected("");
        setStep("editing");
      } catch (error) {
        setStep("input");
        throw error;
      }
    });
  }
  const texts = document
    ? flattenDocument(document).filter((n) => n.type === "text")
    : [];
  const active = texts.find((n) => n.id === selected);
  function change(next: StudioDocument) {
    if (document) setPast([...past.slice(-49), document]);
    setFuture([]);
    setDocument(next);
  }
  const dirty = !!document && JSON.stringify(document) !== saved;
  return (
    <div className="ss-shell seller-demo">
      <header className="ss-header">
        <Link
          className="ss-logo"
          href={
            ("/seller/products/new/" + scenario) as "/seller/products/new/1"
          }
        >
          <Logo />
        </Link>
        <span>판매 관리 · {sample.name}</span>
      </header>
      <p className="demo-notice">
        MSW 시연 {scenario} · 제공된 예시 결과로 동작하며 실제 AI 생성·상품
        게시는 실행하지 않습니다.
      </p>
      {mutation.error && (
        <p className="ss-global-error" role="alert">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "처리하지 못했습니다. 다시 시도해 주세요."}
        </p>
      )}
      {notice && (
        <p className="demo-notice" role="status">
          {notice}
        </p>
      )}
      {step === "input" || step === "generating" ? (
        <main className="ss-form-wrap">
          <div className="ss-heading">
            <h1>AI 상세페이지 제작</h1>
            <StudioSteps current={step === "input" ? 0 : 1} />
          </div>
          <p className="ss-intro">
            작품 사진과 제작 정보를 입력하면 AI가 상세페이지를 만들어 드립니다.
          </p>
          {step === "generating" ? (
            <section className="demo-generating" role="status">
              <h2>AI가 상세페이지 초안을 만들고 있어요.</h2>
              <p>사진과 작품 정보를 확인하고 페이지를 구성합니다.</p>
            </section>
          ) : (
            <StudioInput
              key={formKey}
              onGenerate={generate}
              initialValues={{
                name: sample.name,
                making: sample.making,
                care: sample.care,
              }}
              initialAssets={[
                {
                  imageId: "sample-hero",
                  url: sample.photo,
                  width: 774,
                  height: 774,
                  alt: sample.name,
                  asset_mode: "source",
                  product_generated: false,
                  fidelity_status: "FALLBACK",
                },
              ]}
            />
          )}
        </main>
      ) : (
        document && (
          <main>
            <nav className="demo-toolbar" aria-label="편집 도구">
              <button
                onClick={() => {
                  if (
                    dirty &&
                    !window.confirm(
                      "저장하지 않은 편집 내용이 있습니다. 처음부터 시작할까요?",
                    )
                  )
                    return;
                  setStep("input");
                  setFormKey(formKey + 1);
                  mutation.reset();
                  setNotice("");
                }}
                disabled={mutation.isPending}
              >
                처음부터
              </button>
              {step === "review" ? (
                <>
                  <button onClick={() => setStep("editing")}>
                    편집으로 돌아가기
                  </button>
                  {[774, 600, 360].map((w, i) => (
                    <button
                      key={w}
                      aria-pressed={width === w}
                      onClick={() => setWidth(w)}
                    >
                      {["PC", "태블릿", "모바일"][i]}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    disabled={!past.length || mutation.isPending}
                    onClick={() => {
                      setFuture([document, ...future]);
                      setDocument(past.at(-1)!);
                      setPast(past.slice(0, -1));
                    }}
                  >
                    실행 취소
                  </button>
                  <button
                    disabled={!future.length || mutation.isPending}
                    onClick={() => {
                      setPast([...past, document]);
                      setDocument(future[0]);
                      setFuture(future.slice(1));
                    }}
                  >
                    다시 실행
                  </button>
                </>
              )}
              <button
                disabled={mutation.isPending || !dirty}
                onClick={() =>
                  run(async () => {
                    const result = await saveSellerDemo(
                      scenario,
                      session.current,
                      document,
                    );
                    setSaved(JSON.stringify(result.document));
                    setNotice("시연 초안을 저장했습니다.");
                  })
                }
              >
                임시 저장
              </button>
              <button
                disabled={mutation.isPending || dirty}
                onClick={() =>
                  run(async () => {
                    const response = await requestSellerDemo(
                      scenario,
                      session.current,
                      "GET",
                    );
                    setDocument(response.document);
                    setSaved(JSON.stringify(response.document));
                    setPast([]);
                    setFuture([]);
                    setNotice("저장한 시연 초안을 불러왔습니다.");
                  })
                }
              >
                저장본 불러오기
              </button>
              <button
                disabled={mutation.isPending}
                onClick={() =>
                  step === "editing"
                    ? setStep("review")
                    : run(async () => {
                        const response = await saveSellerDemo(
                          scenario,
                          session.current,
                          document,
                        );
                        setSaved(JSON.stringify(response.document));
                        setNotice(
                          "제작을 완료했습니다. 시연 초안만 저장되며 실제 상품은 게시되지 않습니다.",
                        );
                      })
                }
              >
                {step === "editing" ? "최종 미리보기" : "제작 완료"}
              </button>
            </nav>
            <div
              className={
                "demo-workspace " + (step === "review" ? "is-review" : "")
              }
            >
              {step === "editing" && (
                <aside className="demo-sidebar">
                  <h2>페이지 및 텍스트 편집</h2>
                  <p>항목을 선택해 문구를 수정하세요.</p>
                  <select
                    aria-label="수정할 텍스트"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">텍스트 선택</option>
                    {texts.map((n, i) => (
                      <option key={n.id} value={n.id}>
                        {i + 1}. {n.value?.slice(0, 28)}
                      </option>
                    ))}
                  </select>
                  {active && (
                    <label>
                      텍스트 내용
                      <textarea
                        aria-label="텍스트 내용"
                        value={active.value}
                        maxLength={5000}
                        onChange={(e) =>
                          change(
                            editNode(document, active.id, {
                              text: e.target.value,
                            }),
                          )
                        }
                      />
                    </label>
                  )}
                  <p>{dirty ? "저장하지 않은 변경사항" : "저장된 상태"}</p>
                  <h3>섹션</h3>

                  {document.root.map((node, i) => (
                    <a key={node.id} href={"#demo-section-" + i}>
                      {i + 1}.{" "}
                      {node.id
                        .replace(/^section-\d+-/, "")
                        .replace(/-root$/, "")}
                    </a>
                  ))}
                </aside>
              )}
              <div className="demo-preview">
                <div
                  ref={preview}
                  style={{
                    width: step === "review" ? width : 774,
                    maxWidth: "100%",
                  }}
                >
                  <div
                    className="demo-canvas"
                    style={{ width: 774, zoom: previewScale }}
                  >
                    {document.root.map((node, i) => (
                      <section key={node.id} id={"demo-section-" + i}>
                        <ServerDocument
                          document={{ ...document, root: [node] }}
                          images={{}}
                        />
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        )
      )}
    </div>
  );
}
