import { expect, test } from "@playwright/test";

test("renders the home screen", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/장인몰/);
  await expect(
    page.getByRole("heading", {
      name: "손이 지나간 시간을 그대로 옮겨 담습니다",
    }),
  ).toBeVisible();
});

test("홈 상품 시연 문구 없이 준비된 카드와 찻잔 상세를 보여준다", async ({
  page,
}) => {
  await page.goto("/");
  const best = page.getByRole("region", { name: "베스트", exact: true });
  const promotions = page.getByRole("region", { name: "기획전", exact: true });
  await expect(best.locator("article")).toHaveCount(5);
  await expect(promotions.locator("article")).toHaveCount(4);
  await expect(best.locator("[inert]")).toHaveCount(4);
  await expect(page.getByText("베스트 상품 시연", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("기획전 시연", { exact: true })).toHaveCount(0);
  for (const image of await best.locator("img").all()) {
    await expect(image).toHaveAttribute("src", /\/home-products\//);
  }
  await expect(
    promotions.getByText("대나무 조명", { exact: true }),
  ).toBeVisible();
  await best.getByRole("link", { name: "청자 분청 찻잔", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "청자 분청 찻잔", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "청자 분청 찻잔 상품 상세 이미지",
      exact: true,
    }),
  ).toBeVisible();
});
