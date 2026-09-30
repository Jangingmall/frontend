"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { uploadPublicImage } from "@/api/images/api";
import { createSellerProduct, startGeneration } from "@/api/seller-studio/api";
import { Dialog } from "@/components/ui/dialog";
import { useSellerMutation } from "@/queries/seller-studio/queries";

export function ServerStudioInput({
  productId,
  onStarted,
}: {
  productId?: number;
  onStarted: (productId: number, generationId: number) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({
    productName: "",
    howMade: "",
    careTips: "",
  });
  const [basicOpen, setBasicOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("");
  const created = useRef(productId);
  const [hasProduct, setHasProduct] = useState(Boolean(productId));
  const uploaded = useRef(new Map<File, string>());
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    const timer = setTimeout(() => setPreviews(urls), 0);
    return () => {
      clearTimeout(timer);
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);
  const mutation = useSellerMutation(async (form: FormData) => {
    const title = String(form.get("productName") ?? "").trim();
    const howMade = String(form.get("howMade") ?? "").trim();
    const careTips = String(form.get("careTips") ?? "").trim();
    const price = Number(form.get("price")),
      stock = Number(form.get("stock"));
    if (
      !title ||
      title.length > 15 ||
      !howMade ||
      howMade.length > 2000 ||
      !careTips ||
      careTips.length > 2000 ||
      files.length < 1 ||
      files.length > 8
    )
      throw new Error(
        "작품명·제작 과정·관리 방법과 사진 1~8장을 확인해 주세요.",
      );
    if (!created.current) {
      if (
        !Number.isSafeInteger(price) ||
        price <= 0 ||
        price > 2147483647 ||
        !Number.isSafeInteger(stock) ||
        stock < 0 ||
        stock > 2147483647
      )
        throw new Error(
          "가격은 1원 이상, 재고는 0개 이상 정수로 입력해 주세요.",
        );
      setPhase("상품 등록 중");
      created.current = (
        await createSellerProduct({ title, price, stock })
      ).productId;
    }
    setHasProduct(true);
    window.history.replaceState(
      null,
      "",
      `/seller/products/new?productId=${created.current}`,
    );
    setPhase("사진 업로드 중");
    const images: string[] = [];
    for (const file of files) {
      let imageId = uploaded.current.get(file);
      if (!imageId) {
        imageId = await uploadPublicImage(file, "CONTENT");
        uploaded.current.set(file, imageId);
      }
      images.push(imageId);
    }
    setPhase("AI 생성 요청 중");
    const generation = await startGeneration(created.current, {
      images,
      productName: title,
      howMade,
      careTips,
    });
    onStarted(generation.productId, generation.generationId);
  });
  function selectFiles(next: File[]) {
    if (mutation.isPending) return;
    if (
      files.length + next.length > 8 ||
      next.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 10 * 1024 * 1024,
      )
    ) {
      setError("JPG·PNG·WebP 사진을 최대 8장, 장당 10MB 이내로 선택해 주세요.");
      return;
    }
    setError("");
    setFiles((current) => [...current, ...next]);
  }
  function submit(form: FormData) {
    setError("");
    for (const [key, value] of Object.entries(values)) form.set(key, value);
    void mutation
      .mutateAsync(form)
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "요청에 실패했습니다.",
        ),
      );
  }
  return (
    <>
      <form
        className="ss-input-form sa-figma-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!files.length) {
            setError("사진을 1장 이상 첨부해 주세요.");
            return;
          }
          if (!created.current) {
            setError("");
            setBasicOpen(true);
            return;
          }
          submit(new FormData());
        }}
      >
        <fieldset disabled={mutation.isPending}>
          <div className="ss-upload-field">
            <span className="ss-label">
              사진 첨부<span aria-hidden="true">*</span>
            </span>
            <div
              className={`ss-upload ${dragging ? "is-dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (!mutation.isPending) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFiles(Array.from(event.dataTransfer.files));
              }}
            >
              <input
                ref={fileInput}
                className="sr-only"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                aria-label="사진 첨부"
                onChange={(event) => {
                  selectFiles(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
              {files.length === 0 ? (
                <button
                  type="button"
                  className="ss-upload-button"
                  onClick={() => fileInput.current?.click()}
                >
                  <Image
                    src="/seller-figma/plus.svg"
                    width={16}
                    height={16}
                    alt=""
                  />
                  <span>
                    사진 첨부하기
                    <br />
                    (최대 8장 / 각 10MB 이내)
                  </span>
                </button>
              ) : (
                <div className="ss-thumbnails">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`}>
                      {previews[index] && (
                        <Image
                          src={previews[index]}
                          width={96}
                          height={96}
                          alt={file.name}
                          unoptimized
                        />
                      )}
                      <button
                        type="button"
                        aria-label={`${index + 1}번 사진 삭제`}
                        onClick={() =>
                          setFiles((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {files.length < 8 && (
                    <button
                      type="button"
                      aria-label="사진 추가"
                      onClick={() => fileInput.current?.click()}
                    >
                      ＋
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {(
            [
              ["productName", "상품명", 15, "상품명을 입력해주세요."],
              [
                "howMade",
                "제작 과정 · 상품 설명",
                2000,
                "설명을 입력해주세요.",
              ],
              [
                "careTips",
                "사용 · 보관 관리 방법",
                2000,
                "설명을 입력해주세요.",
              ],
            ] as const
          ).map(([key, label, max, placeholder]) => (
            <label className="ss-field" key={key}>
              <span className="ss-label">
                {label}
                <span aria-hidden="true">*</span>
              </span>
              {key === "productName" ? (
                <input
                  name={key}
                  aria-label={label}
                  required
                  maxLength={max}
                  value={values[key]}
                  readOnly={hasProduct && !productId}
                  placeholder={placeholder}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
              ) : (
                <textarea
                  name={key}
                  aria-label={label}
                  required
                  maxLength={max}
                  value={values[key]}
                  placeholder={placeholder}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
              )}
              <small>
                {values[key].length} / {max} 자
              </small>
            </label>
          ))}
          {error && !basicOpen && (
            <p className="ss-error" role="alert">
              {error}
              {hasProduct ? " 재시도 시 같은 상품을 사용합니다." : ""}
            </p>
          )}
          {mutation.isPending && <p role="status">{phase}</p>}
          <div className="ss-form-actions">
            <button className="ss-button ss-primary" type="submit">
              {mutation.isPending ? phase : "생성하기"}
            </button>
          </div>
        </fieldset>
      </form>
      <Dialog
        open={basicOpen}
        onOpenChange={(open) => {
          if (!mutation.isPending) setBasicOpen(open);
        }}
        title="상품 기본정보"
        description="새 상품의 판매 가격과 재고를 입력하면 상세페이지 생성을 시작합니다."
      >
        <form
          className="ss-shell sa-basic-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit(new FormData(event.currentTarget));
          }}
        >
          <fieldset disabled={mutation.isPending}>
            <label className="ss-field">
              판매 가격 (원) *
              <input
                aria-label="판매 가격 (원) *"
                name="price"
                type="number"
                min={1}
                max={2147483647}
                step={1}
                required
                readOnly={hasProduct}
              />
            </label>
            <label className="ss-field">
              재고 (개) *
              <input
                aria-label="재고 (개) *"
                name="stock"
                type="number"
                min={0}
                max={2147483647}
                step={1}
                required
                readOnly={hasProduct}
              />
            </label>
            {error && (
              <p role="alert" className="ss-error">
                {error}
                {hasProduct
                  ? " 상품은 등록되어 있으며 재시도 시 같은 상품을 사용합니다."
                  : ""}
              </p>
            )}
            {mutation.isPending && <p role="status">{phase}</p>}
            <div className="ss-form-actions">
              <button type="submit" className="ss-button ss-primary">
                {mutation.isPending ? phase : "입력하고 생성하기"}
              </button>
            </div>
          </fieldset>
        </form>
      </Dialog>
    </>
  );
}
