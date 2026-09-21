import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";

import {
  createPresignedUpload,
  uploadPublicImage,
  uploadReturnPhoto,
} from "./api";

// `browser-image-compression`(canvas 기반)·`readImageDimensions`(Image 디코딩)는 jsdom이
// 실제로 이미지를 디코드하지 않아 신뢰할 수 없다 — 이 파일의 관심사(presign → PUT → imageId)와
// 무관하므로 통과만 시킨다.
vi.mock("browser-image-compression", () => ({
  default: async (file: File) => file,
}));
vi.mock("@/utils/image", () => ({
  readImageDimensions: async () => ({ width: 100, height: 100 }),
}));

function fakeFile(name = "photo.webp"): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, {
    type: "image/webp",
  });
}

describe("createPresignedUpload", () => {
  it("purpose가 RETURN이면 요청한 variant(1280w 1개)만 그대로 발급받는다", async () => {
    const result = await createPresignedUpload({
      fileName: "photo.webp",
      contentType: "image/webp",
      purpose: "RETURN",
      sourceWidth: 100,
      sourceHeight: 100,
      variants: [{ name: "1280w", sizeBytes: 1000 }],
    });
    expect(result.imageId).toBeTruthy();
    expect(result.uploads).toHaveLength(1);
    expect(result.uploads[0]!.variant).toBe("1280w");
  });
});

describe("uploadReturnPhoto", () => {
  it("압축·presign·업로드에 성공하면 imageId를 돌려준다", async () => {
    const imageId = await uploadReturnPhoto(fakeFile());
    expect(imageId).toMatch(/^mock-image-/);
  });

  it("S3 PUT이 실패하면(403 등) 사용자에게 보여줄 에러를 던진다(Codex 리뷰 F1)", async () => {
    server.use(
      http.put(
        "https://mock-cdn.midam.local/uploads/*",
        () => new HttpResponse(null, { status: 403 }),
      ),
    );
    await expect(uploadReturnPhoto(fakeFile())).rejects.toThrow(
      "사진 업로드에 실패했습니다.",
    );
  });
});

describe("uploadPublicImage", () => {
  it("320w/640w/1280w 3개 variant를 모두 발급받아 업로드하고 imageId를 돌려준다", async () => {
    const imageId = await uploadPublicImage(fakeFile(), "PRODUCT");
    expect(imageId).toMatch(/^mock-image-/);
  });

  it("variant 중 하나라도 PUT이 실패하면 에러를 던진다", async () => {
    server.use(
      http.put(
        "https://mock-cdn.midam.local/uploads/*/640w",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    await expect(uploadPublicImage(fakeFile(), "PRODUCT")).rejects.toThrow(
      "사진 업로드에 실패했습니다.",
    );
  });
});
