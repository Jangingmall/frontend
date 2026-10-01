import path from "node:path";

import { expect, test } from "@playwright/test";

test("판매자 API 계약: 등록·업로드·생성·서버 저장·페이지 복원·미리보기·목록 이동", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 923 });
  await page.addInitScript(() =>
    localStorage.setItem("midam:mockIdentity", "ARTISAN"),
  );
  await page.goto("/seller/products/new");
  await expect(page.getByLabel("상품명", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "artifacts/seller-api-input.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 923 });
  await page.getByLabel("상품명", { exact: true }).fill("수제 찻잔");
  await page
    .getByLabel("제작 과정 · 상품 설명", { exact: true })
    .fill("직접 빚고 구웠습니다.");
  await page
    .getByLabel("사용 · 보관 관리 방법", { exact: true })
    .fill("부드러운 천으로 닦아주세요.");
  await page
    .getByLabel("사진 첨부", { exact: true })
    .setInputFiles(path.resolve("public/studio/asset-1.png"));
  await page.getByRole("button", { name: "생성하기", exact: true }).click();
  const basicInfo = page.getByRole("dialog", { name: "상품 기본정보" });
  await expect(basicInfo).toBeVisible();
  await basicInfo.getByLabel("판매 가격 (원) *", { exact: true }).fill("35000");
  await basicInfo.getByLabel("재고 (개) *", { exact: true }).fill("4");
  await basicInfo
    .getByRole("button", { name: "입력하고 생성하기", exact: true })
    .click();
  await expect(page).toHaveURL(/productId=\d+&generationId=\d+/);
  await page.reload();

  const pages = page.locator(".ss-canvas > .ss-page");
  const title = pages.first().locator(".sd-editable-text").first();
  await expect(pages).toHaveCount(4);
  await page.getByRole("button", { name: "도움말 닫기", exact: true }).click();
  await expect(title).toHaveText("수제 찻잔");
  await title.fill("수정된 찻잔");
  await title.blur();
  const savedResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      /^\/api\/content\/products\/\d+\/contents\/\d+$/.test(
        new URL(response.url()).pathname,
      ),
  );
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  const saved = await savedResponse;
  expect(saved.ok()).toBe(true);
  expect(saved.request().postDataJSON()).toEqual({
    patches: [{ nodeId: "title", text: "수정된 찻잔" }],
  });
  await expect(
    page.getByRole("status").filter({ hasText: "임시 저장되었습니다" }),
  ).toBeVisible();

  // 로컬 스냅샷 없이 다시 열어도 서버에 저장된 문구가 복원되어야 한다.
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("midam-seller-document-v1:"))
        localStorage.removeItem(key);
    }
  });
  await page.reload();
  await expect(pages).toHaveCount(4);
  await page.getByRole("button", { name: "도움말 닫기", exact: true }).click();
  await expect(title).toHaveText("수정된 찻잔");

  // 새 페이지는 기존 노드 PATCH와 별개로 브라우저에 저장해 복원한다.
  await page
    .getByRole("button", { name: "페이지 4 편집", exact: true })
    .click();
  await page.getByRole("button", { name: "페이지 추가", exact: true }).click();
  await page.getByRole("button", { name: "새 영역 추가", exact: true }).click();
  await expect(pages).toHaveCount(5);
  const addedText = pages.last().locator(".sd-editable-text").first();
  await addedText.fill("브라우저에 보관할 새 페이지");
  await addedText.blur();
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "임시 저장되었습니다" }),
  ).toBeVisible();
  await page.reload();
  await expect(pages).toHaveCount(5);
  await page.getByRole("button", { name: "도움말 닫기", exact: true }).click();
  await expect(title).toHaveText("수정된 찻잔");
  await expect(addedText).toHaveText("브라우저에 보관할 새 페이지");
  await expect(
    page.getByRole("button", { name: "제작 완료", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "artifacts/seller-api-editor.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  await expect(page.locator(".ss-review-device")).toContainText(
    "브라우저에 보관할 새 페이지",
  );
  await expect(page.locator(".sd-editable-text")).toHaveCount(0);
  await page.getByRole("button", { name: "모바일", exact: true }).click();
  await expect(page.locator(".ss-review-device")).toHaveClass(/mobile/);
  await expect(
    page.getByRole("button", { name: "제작 완료", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "artifacts/seller-api-review-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "뒤로가기", exact: true }).click();
  await expect(pages).toHaveCount(5);
  await expect(addedText).toHaveText("브라우저에 보관할 새 페이지");

  await title.fill("이동 전 자동 저장");
  await title.blur();
  await page
    .getByRole("link", { name: "판매 관리로 이동", exact: true })
    .click();
  await expect(page).toHaveURL(/\/seller\/products$/);
  await expect(
    page.getByRole("heading", { name: "내 상품", exact: true }),
  ).toBeVisible();
  const product = page.locator(".sa-products li").filter({
    has: page.getByRole("heading", { name: "수제 찻잔", exact: true }),
  });
  await expect(product).toContainText("35,000원 · 재고 4개 · DRAFT");
  await product
    .getByRole("link", { name: "상세페이지 작업하기", exact: true })
    .click();
  await expect(pages).toHaveCount(5);
  await expect(title).toHaveText("이동 전 자동 저장");
  await expect(addedText).toHaveText("브라우저에 보관할 새 페이지");
});

test("비회원 및 구매자에게 판매자 권한을 안내한다", async ({ page }) => {
  await page.goto("/seller/products/new");
  await expect(
    page.getByRole("heading", { name: "판매자 로그인" }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem("midam:mockIdentity", "USER"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "판매자 계정이 필요합니다" }),
  ).toBeVisible();
});
