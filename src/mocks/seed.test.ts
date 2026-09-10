import { describe, expect, it } from "vitest";

import { productListResponseDto } from "@/api/products/validation";

import { range, seedImageId, seedImageRef } from "./seed";

describe("seedImageId", () => {
  it("is deterministic for a given sequence number", () => {
    expect(seedImageId(1)).toBe(seedImageId(1));
    expect(seedImageId(1)).not.toBe(seedImageId(2));
  });

  it("has the ULID-shaped contract form (image_ + 26 Base32 chars)", () => {
    expect(seedImageId(1)).toMatch(/^image_[0-9A-Z]{26}$/);
    expect(seedImageId(123456)).toMatch(/^image_[0-9A-Z]{26}$/);
  });
});

describe("seedImageRef", () => {
  it("builds the fixed 320/640/1280 webp variant set", () => {
    const ref = seedImageRef(7);

    expect(ref.imageId).toBe(seedImageId(7));
    expect(ref.variants.map((variant) => variant.width)).toEqual([
      320, 640, 1280,
    ]);
    expect(ref.variants.every((variant) => variant.format === "webp")).toBe(
      true,
    );
    expect(ref.variants[0].url).toContain(`${ref.imageId}/320.webp`);
  });

  it("satisfies the product list response contract", () => {
    const result = productListResponseDto.safeParse({
      items: [
        {
          id: 1,
          name: "seed",
          price: 1000,
          thumbnail: seedImageRef(1),
          artisan: { id: 1, name: "seed" },
          craftCategory: null,
          rating: null,
          reviewCount: 0,
          primaryBadge: null,
          status: "ON_SALE",
        },
      ],
      totalCount: 1,
    });

    expect(result.success).toBe(true);
  });
});

describe("range", () => {
  it("returns 1..n", () => {
    expect(range(3)).toEqual([1, 2, 3]);
  });

  it("returns an empty array for non-positive input", () => {
    expect(range(0)).toEqual([]);
    expect(range(-2)).toEqual([]);
  });
});
