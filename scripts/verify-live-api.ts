import assert from "node:assert/strict";

import type { z } from "zod";

import { cartDto } from "../src/api/cart/validation";
import {
  backendCategoriesDto,
  backendProductListDto,
  backendSubcategoriesDto,
} from "../src/api/products/backend-validation";
import { productDetailDto } from "../src/api/products/detail-validation";
import { backendReviewPageDto } from "../src/api/reviews/validation";

// 실제 공개 API 전용. 인증 정보·MSW·주문/결제 변경 요청을 사용하지 않는다.
const origin = new URL(process.env.API_BASE_URL ?? "https://stg.midam.store");
assert.ok(
  ["https:", "http:"].includes(origin.protocol),
  "HTTP(S) origin이 필요합니다.",
);
assert.ok(
  !origin.username && !origin.password,
  "URL에 인증 정보를 넣지 마세요.",
);
assert.equal(origin.pathname, "/", "API_BASE_URL에는 origin만 지정하세요.");
assert.ok(
  !origin.search && !origin.hash,
  "API_BASE_URL에는 origin만 지정하세요.",
);
const productId = Number(process.env.LIVE_PRODUCT_ID);
assert.ok(
  Number.isSafeInteger(productId) && productId > 0,
  "LIVE_PRODUCT_ID에 검증할 공개 상품 ID를 지정하세요.",
);
let passed = 0;
let failed = 0;

async function check<T>(
  path: string,
  schema: z.ZodType<T>,
  verify: (data: T) => void = () => {},
) {
  try {
    const response = await fetch(new URL(path, origin), {
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    assert.equal(response.status, 200, `HTTP ${response.status}`);
    const body = await response.json();
    assert.equal(body.success, true, "성공 응답 봉투가 아닙니다.");
    const data = schema.parse(body.data);
    verify(data);
    console.log(`PASS ${path}`);
    passed++;
    return data;
  } catch (error) {
    failed++;
    console.error(
      `FAIL ${path}: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    );
    return undefined;
  }
}

await check("/api/products/categories", backendCategoriesDto);
await check("/api/products/subcategories", backendSubcategoriesDto);
for (const sort of ["NEWEST", "PRICE_ASC", "PRICE_DESC"]) {
  await check(
    `/api/products?page=0&size=5&sort=${sort}`,
    backendProductListDto,
    (page) => {
      assert.equal(page.number, 0);
      assert.equal(page.size, 5);
      assert.equal(page.content.length, Math.min(5, page.totalElements));
      assert.equal(page.totalPages, Math.ceil(page.totalElements / 5));
      assert.ok(
        page.content.length > 0,
        "비어 있는 목록으로 정렬을 검증할 수 없습니다.",
      );
      for (let i = 1; i < page.content.length; i++) {
        const previous = page.content[i - 1];
        const current = page.content[i];
        if (sort === "PRICE_ASC") assert.ok(previous.price <= current.price);
        if (sort === "PRICE_DESC") assert.ok(previous.price >= current.price);
        if (sort === "NEWEST")
          assert.ok(previous.createdAt >= current.createdAt);
      }
    },
  );
}
const detail = await check(
  `/api/products/${productId}`,
  productDetailDto,
  (product) => {
    assert.equal(product.productId, productId);
    assert.ok(["ON_SALE", "SOLD_OUT"].includes(product.status));
  },
);
if (detail) {
  const params = new URLSearchParams({
    keyword: detail.title,
    page: "0",
    size: "5",
    sort: "NEWEST",
  });
  await check(`/api/products?${params}`, backendProductListDto, (page) => {
    assert.ok(page.totalElements > 0, "상품명 검색 결과가 없습니다.");
    assert.ok(
      page.content.every((product) => product.title.includes(detail.title)),
    );
  });
  await check(
    `/api/products?excludeSoldOut=true&minPrice=${detail.price}&maxPrice=${detail.price}&page=0&size=5`,
    backendProductListDto,
    (page) => {
      if (detail.status === "ON_SALE") assert.ok(page.content.length > 0);
      assert.ok(
        page.content.every(
          (product) =>
            product.status === "ON_SALE" && product.price === detail.price,
        ),
      );
    },
  );
}
await check(
  `/api/products/${productId}/reviews?page=0&size=5&sort=createdAt,desc&sort=id,desc`,
  backendReviewPageDto,
  (page) => {
    assert.equal(page.number, 0);
    assert.equal(page.size, 5);
    assert.ok(page.content.every((review) => review.productId === productId));
  },
);
await check("/api/payments/cart", cartDto);
console.log(
  `실서버 계약 검사: ${passed}개 통과, ${failed}개 실패. 결제 승인·로그인·쓰기 기능의 성공을 의미하지 않습니다.`,
);
process.exitCode = failed ? 1 : 0;
