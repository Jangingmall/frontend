import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/products?category=kitchen");
  await expect(
    page.getByRole("heading", { name: "키친 · 다이닝", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("총 140개", { exact: true })).toBeVisible();
});

test("필터, 페이지, 뒤로가기 및 초기화", async ({ page }) => {
  await page.getByRole("button", { name: "소재", exact: true }).click();
  await page.getByRole("button", { name: "목재", exact: true }).click();
  await expect(page).toHaveURL(/material=wood/);
  await expect(page.getByText("총 24개", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "2 페이지", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator("article")).toHaveCount(4);
  await page.goBack();
  await expect(page.locator("article")).toHaveCount(20);
  await expect(
    page.getByRole("button", { name: "목재", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await expect(page.getByText("총 140개", { exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/material=/);
});

test("정렬과 품절 제외를 새로고침 후에도 유지한다", async ({ page }) => {
  await page.getByRole("combobox", { name: "상품 정렬" }).click();
  await page.getByRole("option", { name: "높은 가격순" }).click();
  await expect(page).toHaveURL(/sort=price-desc/);
  await page.getByRole("checkbox", { name: "품절 상품 제외" }).check();
  await expect(page).toHaveURL(/excludeSoldOut=true/);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "상품 정렬" })).toContainText(
    "높은 가격순",
  );
  await expect(
    page.getByRole("checkbox", { name: "품절 상품 제외" }),
  ).toBeChecked();
  await expect(
    page.locator("article").getByText("품절", { exact: true }),
  ).toHaveCount(0);
});

test("결과가 없는 조건은 초기화할 수 있다", async ({ page }) => {
  await page.goto("/products?category=kitchen&minPrice=999999999");
  await expect(page.getByText("조건에 맞는 상품이 없어요")).toBeVisible();
  await page.getByRole("button", { name: "필터 초기화", exact: true }).click();
  await expect(page.getByText("총 140개", { exact: true })).toBeVisible();
});

test("좁은 화면에서도 가로 스크롤 없이 필터를 쓴다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "가격대", exact: true }).click();
  const slider = page.getByRole("slider", { name: "최소 가격" });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(page).toHaveURL(/minPrice=1000/);
  await expect(slider).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/minPrice=2000/);
  await page.goBack();
  await expect(slider).toHaveAttribute("aria-valuenow", "1000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
