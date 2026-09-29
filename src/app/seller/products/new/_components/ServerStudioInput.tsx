"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { uploadPublicImage } from "@/api/images/api";
import { createSellerProduct, startGeneration } from "@/api/seller-studio/api";
import { useSellerMutation } from "@/queries/seller-studio/queries";

export function ServerStudioInput({
  productId,
  onStarted,
}: {
  productId?: number;
  onStarted: (productId: number, generationId: number) => void;
}) {
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
      !careTips ||
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
  return (
    <form
      className="ss-input-form"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        void mutation
          .mutateAsync(new FormData(event.currentTarget))
          .catch((cause) =>
            setError(
              cause instanceof Error ? cause.message : "요청에 실패했습니다.",
            ),
          );
      }}
    >
      <fieldset disabled={mutation.isPending}>
        <label className="ss-label">
          사진 첨부 *
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            aria-label="사진 첨부"
            onChange={(event) => {
              const next = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (
                next.length > 8 ||
                next.some(
                  (file) =>
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    ) || file.size > 10 * 1024 * 1024,
                )
              ) {
                setError(
                  "JPG·PNG·WebP 사진을 최대 8장, 장당 10MB 이내로 선택해 주세요.",
                );
                return;
              }
              setError("");
              setFiles(next);
            }}
          />
        </label>
        <p>최대 8장, 장당 10MB · 다시 선택하면 사진 목록이 교체됩니다.</p>
        <div className="sa-upload-previews">
          {previews.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={files[index]?.name ?? "선택한 사진"}
              width={96}
              height={96}
              unoptimized
            />
          ))}
        </div>
        <label className="ss-label">
          작품명 *
          <input
            name="productName"
            required
            maxLength={15}
            readOnly={hasProduct && !productId}
          />
        </label>
        {!productId && (
          <div className="sa-fields">
            {hasProduct && (
              <p>
                상품 기본정보는 등록되었습니다. 재시도 시 같은 상품과
                가격·재고를 사용합니다.
              </p>
            )}
            <label className="ss-label">
              판매 가격 (원) *
              <input
                readOnly={hasProduct}
                name="price"
                type="number"
                min={1}
                max={2147483647}
                step={1}
                required
              />
            </label>
            <label className="ss-label">
              재고 (개) *
              <input
                readOnly={hasProduct}
                name="stock"
                type="number"
                min={0}
                max={2147483647}
                step={1}
                required
              />
            </label>
          </div>
        )}
        <label className="ss-label">
          제작 과정 *<textarea name="howMade" required rows={5} />
        </label>
        <label className="ss-label">
          관리 방법 *<textarea name="careTips" required rows={4} />
        </label>
        <button className="sa-primary" disabled={mutation.isPending}>
          {mutation.isPending ? phase : "AI 상세페이지 생성"}
        </button>
      </fieldset>
      {mutation.isPending && <p role="status">{phase}</p>}
      {error && (
        <p role="alert">
          {error}
          {hasProduct
            ? " 상품은 등록되어 있으며 재시도 시 같은 상품을 사용합니다."
            : ""}
        </p>
      )}
    </form>
  );
}
