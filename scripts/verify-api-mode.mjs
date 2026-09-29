import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { createServer } from "node:http";

import { chromium, expect } from "@playwright/test";
// A controlled backend contract fixture, not a claim of deployed-backend integration.
const seen = [];
let authenticated = false;
const backend = createServer((req, res) => {
  seen.push(`${req.method} ${req.url}`);
  const url = new URL(req.url, "http://localhost:9087");
  let status = 200,
    data;
  if (url.pathname === "/api/products/categories")
    data = [{ categoryId: 9, name: "키친·다이닝" }];
  else if (url.pathname === "/api/products/subcategories")
    data = [{ subcategoryId: 72, categoryId: 9, name: "다기·찻잔" }];
  else if (url.pathname === "/api/products/materials")
    data = ["도자기", "나무"];
  else if (url.pathname === "/api/products")
    data = {
      content: [],
      number: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    };
  else if (url.pathname === "/api/member/artisans") data = { content: [] };
  else if (url.pathname === "/api/member/token/refresh" && authenticated)
    data = { accessToken: "contract-fixture-access-token" };
  else if (url.pathname === "/api/member/me" && authenticated)
    data = {
      memberId: 901,
      name: "계약 확인 사용자",
      email: "contract@example.com",
      nickname: null,
      role: "USER",
      profileImageUrl: null,
      phone: "01012345678",
      authProvider: "LOCAL",
    };
  else if (url.pathname === "/api/member/me/addresses" && authenticated)
    data = [
      {
        addressId: 902,
        recipientName: "계약 확인 수령인",
        phone: "01012345678",
        zipCode: "04524",
        address1: "서울특별시 중구 세종대로 110",
        address2: "계약 확인",
        isDefault: true,
      },
    ];
  else if (
    ["/api/payments/cart", "/api/payments/cart/merge"].includes(url.pathname)
  )
    data = authenticated
      ? {
          sections: [
            {
              artisanId: 903,
              artisanName: "계약 확인 장인",
              shippingFee: 0,
              freeShippingThreshold: null,
              items: [
                {
                  cartItemId: 904,
                  productId: 905,
                  productName: "백엔드 계약 확인 상품",
                  unitPrice: 1000,
                  quantity: 1,
                  subtotal: 1000,
                  thumbnail: [],
                  isCustomOrder: false,
                  soldOut: false,
                  selected: true,
                  selectedOptions: [],
                  textInputs: [],
                },
              ],
            },
          ],
          totalPrice: 1000,
          totalShippingFee: 0,
          totalCount: 1,
        }
      : { sections: [], totalPrice: 0, totalShippingFee: 0, totalCount: 0 };
  else {
    status = 401;
  }
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      status === 200
        ? { success: true, status, data }
        : { success: false, status, errorCode: "UNAUTHORIZED" },
    ),
  );
});
await new Promise((resolve) => backend.listen(9087, "127.0.0.1", resolve));
mkdirSync("test-results", { recursive: true });
const log = createWriteStream("test-results/api-mode-server.log");
const next = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--port", "3101"],
  {
    windowsHide: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_DATA_MODE: "api",
      NEXT_PUBLIC_API_MOCKING: "",
      API_BASE_URL: "http://127.0.0.1:9087",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
next.stdout.pipe(log);
next.stderr.pipe(log);
let browser;
try {
  const base = "http://localhost:3101";
  for (let i = 0; i < 90; i++) {
    try {
      const result = await fetch(`${base}/login`, {
        signal: AbortSignal.timeout(2000),
      });
      if (result.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  // A stale demo flag from the previous implementation must never activate MSW.
  await context.addInitScript(() =>
    sessionStorage.setItem("midam:api-demo-session", "1"),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  const browserRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  context.on("request", (request) => browserRequests.push(request.url()));

  await page.goto(`${base}/`);
  await expect(
    page.getByRole("heading", { name: "베스트", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "기획전", exact: true }),
  ).toHaveCount(0);
  await page.goto(
    `${base}/products?category=subcategory-72&material=ceramic&subcategory=ceramic&hasGiftWrap=true&sort=popular`,
  );
  await page
    .getByRole("heading", { name: "다기·찻잔", exact: true, level: 1 })
    .waitFor();
  for (const label of ["소재", "선물 포장", "공예"])
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toHaveCount(0);
  await expect(page.locator('a[href*="preview=1"]')).toHaveCount(0);
  const sort = page.getByRole("combobox", { name: "상품 정렬" });
  await expect(sort).toHaveText("인기순");
  await sort.click();
  await expect(page.getByRole("option")).toHaveText([
    "인기순",
    "최신순",
    "낮은 가격순",
    "높은 가격순",
  ]);
  await page.keyboard.press("Escape");
  const productRequests = seen.filter((path) =>
    path.startsWith("GET /api/products?"),
  );
  assert(productRequests.length > 0, "API products request missing");
  assert(
    productRequests.some(
      (path) =>
        new URL(path.slice(4), "http://fixture").searchParams.get("sort") ===
        "POPULAR",
    ),
    "POPULAR request missing",
  );
  for (const request of productRequests) {
    const params = new URL(request.slice(4), "http://fixture").searchParams;
    assert(
      !params.has("material") && !params.has("hasGiftWrap"),
      "unsupported filters reached backend",
    );
    assert(
      !["SALES", "WISHLIST"].includes(params.get("sort")),
      "unsupported sort reached backend",
    );
  }
  await page.screenshot({
    path: "test-results/api-mode-filter.png",
    fullPage: true,
  });
  await page.goto(`${base}/products/contract-905?preview=1`);
  await expect(
    page.getByRole("heading", { name: "상품을 찾을 수 없습니다" }),
  ).toBeVisible();

  await page.goto(`${base}/login`);
  await expect(
    page.getByRole("button", { name: "네이버로 로그인" }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "네이버로 로그인" }),
  ).toBeDisabled();
  await page.goto(`${base}/signup`);
  await expect(
    page.getByRole("button", { name: "네이버로 빠르게 가입하기" }),
  ).toBeDisabled();
  await page.goto(`${base}/cart?preview=1`);
  await page.getByRole("heading", { name: "장바구니", exact: true }).waitFor();
  await expect(page.getByText(/시연 장바구니|주문·결제 시연/)).toHaveCount(0);

  // Authenticate through the real refresh/me HTTP paths against this fixture only.
  authenticated = true;
  // Substitute only the third-party script to test the address button/callback
  // deterministically. This does not certify live Kakao network availability.
  await context.route(
    "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `window.kakao = { Postcode: class { constructor(options) { this.options = options; } open() { window.__postcodeOpened = true; this.options.oncomplete({zonecode: "03048", roadAddress: "서울특별시 종로구 북촌로 37", address: "서울 종로구 가회동"}); } } };`,
      }),
  );
  await page.goto(`${base}/checkout/new?items=904`);
  await expect(page.getByRole("textbox", { name: "주문자 이름" })).toHaveValue(
    "계약 확인 사용자",
  );
  await expect(page.getByRole("textbox", { name: "수령인 이름" })).toHaveValue(
    "계약 확인 수령인",
  );
  await expect(page.getByRole("radio", { name: "무통장입금" })).toBeDisabled();
  for (const label of ["할인코드", "적립금"])
    await expect(page.getByRole("textbox", { name: label })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "쿠폰" })).toHaveCount(0);
  await page.screenshot({
    path: "test-results/api-mode-checkout.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "주소검색" }).click();
  await expect(page.getByRole("textbox", { name: "기본주소" })).toHaveValue(
    "서울특별시 종로구 북촌로 37",
  );
  assert(
    await page.evaluate(() => window.__postcodeOpened),
    "postcode SDK open was not called",
  );
  await page.goto(`${base}/checkout/ui-preview-order`);
  await expect(page.getByRole("button", { name: "결제하기" })).toBeDisabled();
  await expect(page.getByText(/주문·결제 시연/)).toHaveCount(0);
  await page.goto(`${base}/checkout/ui-preview-order/complete?result=success`);
  await expect(
    page.getByText("페이지를 찾을 수 없어요", { exact: true }),
  ).toBeVisible();
  assert.equal(
    seen.filter((path) =>
      /^POST \/api\/payments(?:$|\/(?:orders|confirm|fail)(?:[/?]|$))/.test(
        path,
      ),
    ).length,
    0,
    "verification created a payment/order",
  );
  assert.equal(
    seen.filter((path) => path.includes("/api/mock/")).length,
    0,
    "mock namespace reached backend",
  );
  assert.equal(
    browserRequests.filter(
      (url) =>
        url.includes("/api/mock/") || url.includes("mockServiceWorker.js"),
    ).length,
    0,
    "mock request or worker reached browser",
  );
  assert.equal(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    ),
    0,
    "service worker remains registered in API mode",
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  process.stdout.write(
    "API mode browser checks passed: unsupported UI hidden, real HTTP catalogue/auth/cart/checkout paths, stale demo flag ignored, preview routes blocked, postcode SDK callback wired; no hydration errors, mock requests, workers, orders or payments. Third-party postcode script is a deterministic fixture; deployed backend and actual payment gateway are not verified.\n",
  );
} finally {
  await browser?.close();
  next.kill();
  backend.close();
  log.end();
}
