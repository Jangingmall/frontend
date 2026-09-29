import path from "node:path";

import { expect, test } from "@playwright/test";
test("판매자 API 계약: 등록·업로드·생성·새로고침·수정·저장·검수·게시", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("midam:mockIdentity", "ARTISAN"),
  );
  await page.goto("/seller/products/new");
  await expect(page.getByLabel("작품명")).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/seller-api/input.png",
    fullPage: true,
  });
  await page.getByLabel("작품명").fill("수제 찻잔");
  await page.getByLabel("판매 가격").fill("35000");
  await page.getByLabel("재고").fill("4");
  await page.getByLabel("제작 과정").fill("직접 빚고 구웠습니다.");
  await page.getByLabel("관리 방법").fill("부드러운 천으로 닦아주세요.");
  await page
    .getByLabel("사진 첨부", { exact: true })
    .setInputFiles(path.resolve("public/studio/asset-1.png"));
  await page
    .getByRole("button", { name: "AI 상세페이지 생성", exact: true })
    .click();
  await expect(page).toHaveURL(/productId=\d+&generationId=\d+/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "상세페이지 편집" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "문구 1", exact: true })
    .fill("수정된 찻잔");
  await page.getByRole("button", { name: "서버에 저장", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("서버에 저장했습니다.");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "문구 1", exact: true }),
  ).toHaveValue("수정된 찻잔");
  await page.screenshot({
    path: "docs/screenshots/seller-api/editor.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "최종 확인", exact: true }).click();
  await page.getByRole("button", { name: "모바일", exact: true }).click();
  await page.getByRole("button", { name: "저장하고 검수 요청" }).click();
  await expect(
    page.getByRole("button", { name: "확인하고 승인" }),
  ).toBeDisabled();
  await page.getByLabel("내용이 사실과 일치합니다.").check();
  await page.getByLabel("사진이 실제 작품과 일치합니다.").check();
  await page.getByRole("button", { name: "확인하고 승인" }).click();
  await page.getByRole("button", { name: "콘텐츠 게시", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "콘텐츠 게시 요청이 완료",
  );
  await page.getByRole("link", { name: "내 상품으로" }).click();
  await expect(
    page.getByRole("heading", { name: "수제 찻잔", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("35,000원 · 재고 4개 · DRAFT")).toBeVisible();
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
