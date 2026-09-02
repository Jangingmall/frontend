import { expect, test } from "@playwright/test";

test("renders the frontend foundation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/장인몰/);
  await expect(page.getByRole("main")).toContainText(
    "프론트엔드 기반 환경이 준비되었습니다.",
  );
});
