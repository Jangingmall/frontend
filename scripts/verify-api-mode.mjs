import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { createServer } from "node:http";

import { chromium } from "@playwright/test";
// A controlled backend contract fixture, not a claim of deployed-backend integration.
const seen = [];
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
  else if (url.pathname === "/api/payments/cart")
    data = { sections: [], totalPrice: 0, totalShippingFee: 0, totalCount: 0 };
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
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/products?category=subcategory-72`);
  await page
    .getByRole("heading", { name: "다기·찻잔", exact: true, level: 1 })
    .waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: "도자기", exact: true }).waitFor();
  assert(
    seen.some((path) =>
      path.includes("/api/products/materials?subcategoryId=72"),
    ),
    "live material request missing",
  );
  const before = seen.filter((path) =>
    path.startsWith("GET /api/products?"),
  ).length;
  await page.getByRole("button", { name: "도자기", exact: true }).click();
  await page.getByText(/이 검색 조건은 시연 상품/).waitFor();
  await page
    .locator('a[href*="preview=1"]')
    .first()
    .waitFor({ timeout: 30000 });
  assert.equal(
    seen.filter((path) => path.startsWith("GET /api/products?")).length,
    before,
    "demo filtering reached backend",
  );
  await page.screenshot({
    path: "test-results/api-mode-filter.png",
    fullPage: true,
  });
  await page.goto(`${base}/login`);
  await page.getByRole("button", { name: /네이버/ }).click();
  await page.getByText(/네이버 로그인 시연/).waitFor({ timeout: 30000 });
  await page.reload();
  await page.getByText(/네이버 로그인 시연/).waitFor({ timeout: 30000 });
  await page.goto(`${base}/cart`);
  await page.getByRole("heading", { name: "장바구니", exact: true }).waitFor();
  assert.equal(
    seen.filter((path) => path.includes("/api/mock/")).length,
    0,
    "mock namespace reached backend",
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  process.stdout.write(
    "API mode browser checks passed: real materials + empty products, MSW filters, Naver demo reload, isolated cart; no hydration errors or mock requests on backend.\n",
  );
} finally {
  await browser?.close();
  next.kill();
  backend.close();
  log.end();
}
