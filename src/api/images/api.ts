import imageCompression from "browser-image-compression";

import { clientFetch } from "@/lib/http/client";
import { readImageDimensions } from "@/utils/image";

import { presignedUploadDto } from "./validation";

/**
 * 이미지 업로드 도메인 API 함수. (`ImageController`, `docs/api-contract.md` §8 — 실제 BE
 * 계약 그대로. `purpose`마다 요구되는 variant 개수가 다르다 — `RETURN`은 `1280w` 1개뿐)
 */

export interface CreatePresignedUploadInput {
  fileName: string;
  contentType: string;
  purpose: "PRODUCT" | "ARTISAN" | "CONTENT" | "RETURN";
  sourceWidth: number;
  sourceHeight: number;
  variants: { name: string; sizeBytes: number }[];
}

export interface PresignedUpload {
  imageId: string;
  uploads: { variant: string; objectKey: string; presignedUrl: string }[];
  expiresInSeconds: number;
}

/** `POST /api/images/presigned-url` → variant별 업로드 URL 발급. */
export async function createPresignedUpload(
  input: CreatePresignedUploadInput,
): Promise<PresignedUpload> {
  const data = await clientFetch<unknown>("/api/images/presigned-url", {
    method: "POST",
    body: input,
  });
  return presignedUploadDto.parse(data);
}

/**
 * 취소·교환·환불 신청 사진 첨부 전용 헬퍼(`purpose: "RETURN"`, variant `1280w` 1개만).
 * WebP로 압축·변환(`browser-image-compression`, BE가 WebP로 서명한 URL만 준다) → presign
 * 발급 → S3에 직접 PUT(`clientFetch`가 아니라 순수 `fetch` — presigned URL 자체가 인가
 * 수단이고, `clientFetch`는 same-origin `/api` 경로만 허용한다) → `imageId` 반환.
 */
export async function uploadClaimPhoto(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1280,
    fileType: "image/webp",
  });
  const { width, height } = await readImageDimensions(compressed);
  const presigned = await createPresignedUpload({
    fileName: file.name,
    contentType: "image/webp",
    purpose: "RETURN",
    sourceWidth: width,
    sourceHeight: height,
    variants: [{ name: "1280w", sizeBytes: compressed.size }],
  });
  const upload = presigned.uploads[0];
  if (!upload) {
    throw new Error("업로드 URL을 발급받지 못했습니다.");
  }
  const putResponse = await fetch(upload.presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/webp" },
    body: compressed,
  });
  // `fetch`는 403(만료된 URL)·5xx 같은 HTTP 실패에서 reject하지 않는다 — `ok`를 직접
  // 봐야 한다. S3 응답 상태코드는 우리 API 상태코드 의미체계와 달라(`ApiError`가 아니라)
  // 일반 `Error`로 던진다 — `resolveErrorMessage`가 status로 오분류된 문구를 고르지 않게.
  if (!putResponse.ok) {
    throw new Error("사진 업로드에 실패했습니다. 다시 시도해주세요.");
  }
  return presigned.imageId;
}
