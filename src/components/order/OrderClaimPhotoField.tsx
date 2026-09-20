"use client";

import type { ChangeEvent } from "react";
import { useId, useRef, useState } from "react";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

interface OrderClaimPhotoFieldProps {
  value: File[];
  onChange: (files: File[]) => void;
  required?: boolean;
  error?: string;
}

/**
 * 취소·교환·환불 신청 모달(MY-request·MY-exchange)이 공유하는 사진 첨부 — `File[]` 선택·
 * 로컬 미리보기만 책임진다. 실제 업로드는 `components/{domain}`이 api를 직접 호출하지
 * 않는다는 규칙(`architecture.md` §8.2)에 따라 제출 시점에 mutation 계층
 * (`useRequestOrderCancelMutation`/`useRequestOrderExchangeRefundMutation`)이 수행한다.
 */
export function OrderClaimPhotoField({
  value,
  onChange,
  required = false,
  error,
}: OrderClaimPhotoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const oversized = files.some((file) => file.size > MAX_PHOTO_BYTES);
    if (oversized) {
      setLocalError("사진은 각 10MB 이내로 첨부해주세요.");
      return;
    }
    const next = [...value, ...files].slice(0, MAX_PHOTOS);
    if (value.length + files.length > MAX_PHOTOS) {
      setLocalError(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
    } else {
      setLocalError(null);
    }
    onChange(next);
  }

  function removeAt(index: number) {
    setLocalError(null);
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="flex items-center gap-1 text-body-s-b text-font-dark"
      >
        사진 첨부
        {required && <span className="font-normal text-red-font">*</span>}
      </label>

      <div className="flex flex-wrap gap-2">
        {value.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="relative size-20 shrink-0 overflow-hidden rounded-xs border border-border-neutral-weak"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 File 미리보기, next/image 최적화 대상 아님 */}
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`${file.name} 삭제`}
              className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-bg-deam text-font-white"
            >
              ×
            </button>
          </div>
        ))}

        {value.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xs border border-dashed border-border-neutral-weak text-caption text-font-dark-subtle"
          >
            <span className="text-title-s">+</span>
            <span>사진 첨부하기</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="sr-only"
      />

      <p className="text-caption text-font-dark-weak">
        최대 {MAX_PHOTOS}장 / 각 10MB 이내
      </p>

      {(localError ?? error) != null && (
        <p role="alert" className="text-caption text-red-font">
          {localError ?? error}
        </p>
      )}
    </div>
  );
}
