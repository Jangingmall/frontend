"use client";
import Image from "next/image";
import { useRef, useState } from "react";

import type { StudioAsset, StudioDraft } from "./studio-contract";
import { createDraft, readImages } from "./studio-state";
interface StudioInputProps {
  onGenerate: (draft: StudioDraft, assets: StudioAsset[]) => void;
}
export function StudioInput({ onGenerate }: StudioInputProps) {
  const [values, setValues] = useState({ name: "", making: "", care: "" });
  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [error, setError] = useState("");
  const [isUploading, setUploading] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const uploadLock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  async function upload(files: FileList | null) {
    if (!files?.length || uploadLock.current) return;
    uploadLock.current = true;
    setUploading(true);
    setError("");
    try {
      const next = await readImages(Array.from(files), assets.length);
      setAssets((current) => [...current, ...next]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "사진을 읽지 못했습니다.",
      );
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  }
  return (
    <form
      className="ss-input-form"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          onGenerate(createDraft(values, assets), assets);
        } catch {
          setError("사진과 모든 필수 정보를 입력해 주세요.");
        }
      }}
    >
      <fieldset disabled={isUploading}>
        <div className="ss-upload-field">
          <span className="ss-label">
            사진 첨부<span aria-hidden="true">*</span>
          </span>
          <div
            className={`ss-upload ${isDragging ? "is-dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void upload(event.dataTransfer.files);
            }}
          >
            <input
              className="sr-only"
              ref={fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              aria-label="사진 첨부"
              onChange={(event) => {
                void upload(event.target.files);
                event.target.value = "";
              }}
            />
            {assets.length === 0 ? (
              <button
                type="button"
                className="ss-upload-button"
                onClick={() => fileInput.current?.click()}
              >
                <span className="ss-plus">＋</span>
                <strong>
                  {isUploading ? "사진 준비 중" : "사진 첨부하기"}
                </strong>
                <span>(최대 8장, 10MB 이내)</span>
              </button>
            ) : (
              <div className="ss-thumbnails">
                {assets.map((asset, index) => (
                  <div key={asset.imageId}>
                    <Image
                      src={asset.url}
                      width={96}
                      height={96}
                      alt={asset.alt}
                      unoptimized
                    />
                    <button
                      type="button"
                      aria-label={`${index + 1}번 사진 삭제`}
                      onClick={() =>
                        setAssets((current) =>
                          current.filter(
                            (item) => item.imageId !== asset.imageId,
                          ),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                {assets.length < 8 && (
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
            ["name", "상품명", 15, "상품명을 입력해주세요."],
            ["making", "제작 과정 · 상품 설명", 100, "설명을 입력해주세요."],
            ["care", "사용 · 보관 관리 방법", 100, "설명을 입력해주세요."],
          ] as const
        ).map(([key, label, max, placeholder]) => (
          <label className="ss-field" key={key}>
            <span className="ss-label">
              {label}
              <span aria-hidden="true">*</span>
            </span>
            {key === "name" ? (
              <input
                required
                value={values[key]}
                maxLength={max}
                placeholder={placeholder}
                onChange={(event) =>
                  setValues({ ...values, [key]: event.target.value })
                }
              />
            ) : (
              <textarea
                required
                value={values[key]}
                maxLength={max}
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
        {error && (
          <p className="ss-error" role="alert">
            {error}
          </p>
        )}
        <div className="ss-form-actions">
          <button className="ss-button ss-primary" type="submit">
            생성하기
          </button>
        </div>
      </fieldset>
    </form>
  );
}
