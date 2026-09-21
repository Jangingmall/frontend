"use client";

import type { ChangeEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { PlusIcon } from "@/components/ui/icons";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

interface OrderClaimPhotoFieldProps {
  value: File[];
  onChange: (files: File[]) => void;
  required?: boolean;
  /** 상단 "사진 첨부" 라벨을 숨긴다 — 후기 작성 모달(Figma 1362:35796)엔 라벨이 없다. */
  showLabel?: boolean;
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
  showLabel = true,
  error,
}: OrderClaimPhotoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // 미리보기 URL은 `value`를 바꾸는 이 두 핸들러 안에서만 만들고 해제한다 — 렌더 중엔
  // 절대 호출하지 않는다. 렌더 중 호출(`useMemo` 등)은 커밋되지 않고 버려지는 렌더에서도
  // 실행돼 새고(Codex 리뷰 F3), `useEffect`에서 만들면 커밋 이후에야 생겨 사진을 추가할
  // 때마다 썸네일이 한 프레임 늦게 뜬다(`react-hooks/set-state-in-effect`가 막는 이유이기도
  // 하다). `value`와 항상 같은 길이로 맞춰 든다.
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewUrlsRef = useRef(previewUrls);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  // 모달이 통째로 닫혀 언마운트될 때 그 시점까지 남아 있는 URL을 전부 해제한다(예: 폼
  // `reset()`으로 `value`가 이 핸들러를 거치지 않고 바로 `[]`가 되는 경우 — 그래도 실제
  // 상위 모달은 곧이어 언마운트되므로 여기서 정리된다).
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
    const addedUrls = next
      .slice(value.length)
      .map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...addedUrls]);
    if (value.length + files.length > MAX_PHOTOS) {
      setLocalError(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
    } else {
      setLocalError(null);
    }
    onChange(next);
  }

  function removeAt(index: number) {
    setLocalError(null);
    const removedUrl = previewUrls[index];
    if (removedUrl) URL.revokeObjectURL(removedUrl);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-body-s-b text-font-dark"
        >
          사진 첨부
          {required && <span className="font-normal text-red-font">*</span>}
        </label>
      )}

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-27.5 w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-jade-fill bg-bg-default text-center"
        >
          <PlusIcon className="size-8" />
          <span className="text-caption-b text-font-dark-subtle">
            사진 첨부하기
            <br />
            (최대 {MAX_PHOTOS}장 / 각 10MB 이내)
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-xs border border-border-neutral-weak"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 File 미리보기, next/image 최적화 대상 아님 */}
              <img
                src={previewUrls[index]}
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
              <span>추가</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="sr-only"
      />

      {value.length > 0 && (
        <p className="text-caption text-font-dark-weak">
          최대 {MAX_PHOTOS}장 / 각 10MB 이내
        </p>
      )}

      {(localError ?? error) != null && (
        <p role="alert" className="text-caption text-red-font">
          {localError ?? error}
        </p>
      )}
    </div>
  );
}
