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

/** 원본을 WebP로 압축·변환한다(BE가 WebP로 서명한 URL만 준다). */
async function compressToWebp(
  file: File,
  maxWidthOrHeight: number,
): Promise<File> {
  return imageCompression(file, { maxWidthOrHeight, fileType: "image/webp" });
}

/**
 * S3에 직접 PUT(`clientFetch`가 아니라 순수 `fetch` — presigned URL 자체가 인가 수단이고,
 * `clientFetch`는 same-origin `/api` 경로만 허용한다). `fetch`는 403(만료된 URL)·5xx 같은
 * HTTP 실패에서 reject하지 않는다 — `ok`를 직접 봐야 한다. S3 응답 상태코드는 우리 API
 * 상태코드 의미체계와 달라(`ApiError`가 아니라) 일반 `Error`로 던진다 —
 * `resolveErrorMessage`가 status로 오분류된 문구를 고르지 않게.
 */
async function putVariant(url: string, blob: Blob): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "image/webp" },
    body: blob,
  });
  if (!response.ok) {
    throw new Error("사진 업로드에 실패했습니다. 다시 시도해주세요.");
  }
}

/**
 * 취소·교환·환불 신청 사진 첨부 전용(`purpose: "RETURN"`, variant `1280w` 1개만) — presign
 * 발급 → S3에 직접 PUT → `imageId` 반환.
 */
export async function uploadReturnPhoto(file: File): Promise<string> {
  const compressed = await compressToWebp(file, 1280);
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
  await putVariant(upload.presignedUrl, compressed);
  return presigned.imageId;
}

/**
 * 공개 이미지 3-variant 업로드(320w/640w/1280w) — BE `ImageService.REQUIRED_PUBLIC_VARIANTS`
 * (`RETURN` 이외 모든 purpose 공통, 하나라도 빠지면 `INVALID_INPUT`). 원본 실제 크기
 * (`sourceWidth`/`sourceHeight`)는 압축 전 원본에서 한 번만 읽는다 — BE가 이 값으로 각
 * variant의 표시 높이를 비율 계산하므로 압축본이 아니라 원본 기준이어야 정확하다. 세
 * 크기로 각각 압축해 각자의 presigned URL로 PUT한다. 지금은 후기 사진(`PRODUCT`)에서만
 * 쓰지만 다른 공개 purpose(`ARTISAN`/`CONTENT`)도 같은 3-variant 계약이라 필요해지면
 * 그대로 재사용할 수 있다.
 */
export async function uploadPublicImage(
  file: File,
  purpose: "PRODUCT" | "ARTISAN" | "CONTENT",
): Promise<string> {
  const SIZES = [320, 640, 1280] as const;
  const { width: sourceWidth, height: sourceHeight } =
    await readImageDimensions(file);
  const compressed = await Promise.all(
    SIZES.map((size) => compressToWebp(file, size)),
  );
  const presigned = await createPresignedUpload({
    fileName: file.name,
    contentType: "image/webp",
    purpose,
    sourceWidth,
    sourceHeight,
    variants: SIZES.map((size, index) => ({
      name: `${size}w`,
      sizeBytes: compressed[index]!.size,
    })),
  });
  await Promise.all(
    SIZES.map((size, index) => {
      const upload = presigned.uploads.find(
        (item) => item.variant === `${size}w`,
      );
      if (!upload) {
        throw new Error("업로드 URL을 발급받지 못했습니다.");
      }
      return putVariant(upload.presignedUrl, compressed[index]!);
    }),
  );
  return presigned.imageId;
}

/** 후기 사진 첨부 전용 — `purpose: "PRODUCT"` 고정. */
export async function uploadReviewPhoto(file: File): Promise<string> {
  return uploadPublicImage(file, "PRODUCT");
}
