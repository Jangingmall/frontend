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
