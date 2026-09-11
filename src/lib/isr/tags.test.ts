import { describe, expect, it } from "vitest";

import { isrTags } from "./tags";

describe("isrTags", () => {
  it("고정 태그는 상수 문자열을 반환한다", () => {
    expect(isrTags.productList()).toBe("products");
    expect(isrTags.productArtisan()).toBe("product-artisan");
    expect(isrTags.productTaxonomy()).toBe("product-taxonomy");
    expect(isrTags.artisanList()).toBe("artisans");
  });

  it("id 태그는 콜론으로 id를 보간한다", () => {
    expect(isrTags.product(123)).toBe("product:123");
    expect(isrTags.artisan(45)).toBe("artisan:45");
  });
});
