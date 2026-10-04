import { expect, type Page } from "@playwright/test";
export async function startSellerDemo(
  page: Page,
  scenario: string,
  productName?: string,
) {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`/seller/products/new/${scenario}`);
  await expect(page.getByLabel("상품명", { exact: true })).toHaveValue(
    scenario === "1" ? "청자 분청 찻잔" : "전주 합죽선 매화선",
  );
  if (productName)
    await page.getByLabel("상품명", { exact: true }).fill(productName);
  await page.getByRole("button", { name: "생성하기", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "상품 기본정보" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", {
      name: "AI가 상세페이지 초안을 만들고 있어요.",
    }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("button", { name: "미리보기", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "도움말 닫기" }).click();
  await expect(page).toHaveURL(new RegExp(`/seller/products/new/${scenario}$`));
}
