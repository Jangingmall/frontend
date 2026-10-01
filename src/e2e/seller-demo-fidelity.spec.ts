import { expect, test } from "@playwright/test";

import { startSellerDemo } from "./seller-demo-helpers";
for (const id of ["1", "2"]) {
  test(`shared editor preserves PNG sections ${id}`, async ({ page }) => {
    await startSellerDemo(page, id);
    const sections = page.locator(".sa-document > section");
    await expect(sections).toHaveCount(id === "1" ? 8 : 9);
    const gallery = sections.nth(id === "1" ? 2 : 5);
    await expect(gallery.locator("img")).toHaveCount(5);
    if (id === "2") {
      await expect(sections.nth(6).locator("article")).toHaveCount(3);
      await expect(sections.nth(3)).toContainText("선면의 기본 배경");
    } else
      await expect(sections.nth(6)).toContainText(
        "잔 표면 전체에 연한 청록색 유약",
      );
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.querySelectorAll(".sa-document img")].map((i) =>
          (i as HTMLImageElement).decode(),
        ),
      );
    });
    for (let i = 0; i < (await sections.count()); i++)
      await sections.nth(i).screenshot({
        path: `artifacts/sections-${id}-${i + 1}.png`,
        style:
          ".ss-tools,.ss-page-list,.ss-editor-actions,.ss-header,nextjs-portal {visibility:hidden !important}",
      });
    await page.getByRole("button", { name: "제작 완료", exact: true }).click();
    await page.getByRole("button", { name: "모바일", exact: true }).click();
    const canvas = page.locator(".sa-document-canvas").first();
    await expect
      .poll(async () => Math.round((await canvas.boundingBox())!.width))
      .toBeLessThanOrEqual(360);
  });
}
