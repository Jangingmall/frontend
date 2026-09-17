import { describe, expect, it } from "vitest";

import type { ImageRef } from "@/types/image";

import { pickThumbnailVariant } from "./image";

const thumbnail: ImageRef = {
  imageId: "image_01HXYZ",
  variants: [
    { width: 320, url: "/320.webp", format: "webp" },
    { width: 640, url: "/640.webp", format: "webp" },
    { width: 1280, url: "/1280.webp", format: "webp" },
  ],
};

describe("pickThumbnailVariant", () => {
  it("목표 폭과 일치하는 variant를 고른다", () => {
    expect(pickThumbnailVariant(thumbnail, 640)).toEqual(thumbnail.variants[1]);
  });

  it("일치하는 variant가 없으면 첫 variant로 대체한다", () => {
    const missing640: ImageRef = {
      imageId: thumbnail.imageId,
      variants: [thumbnail.variants[0]!, thumbnail.variants[2]!],
    };
    expect(pickThumbnailVariant(missing640, 640)).toEqual(
      missing640.variants[0],
    );
  });

  it("variant가 하나도 없으면 undefined를 돌려준다", () => {
    expect(pickThumbnailVariant({ imageId: "x", variants: [] }, 640)).toBe(
      undefined,
    );
  });
});
