import { expect, test } from "@playwright/test";
for (const id of ["1", "2"]) {
  test(`demo ${id} restores section content and layout`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`/seller/products/new/${id}`);
    await page.getByRole("button", { name: "생성하기", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "최종 미리보기", exact: true }),
    ).toBeVisible({ timeout: 20000 });
    const sections = page.locator(".demo-canvas > section");
    await expect(sections).toHaveCount(id === "1" ? 8 : 9);
    const gallery = sections.nth(id === "1" ? 2 : 5);
    await expect(gallery.locator("img")).toHaveCount(5);
    if (id === "2") {
      await expect(sections.nth(6).locator("article")).toHaveCount(3);
      await expect(sections.nth(3)).toContainText("선면의 기본 배경");
    } else {
      await expect(sections.nth(6)).toContainText(
        "잔 표면 전체에 연한 청록색 유약",
      );
    }
    const split = sections.nth(id === "1" ? 3 : 2);
    const photo = await split.locator("img").boundingBox();
    const title = await split
      .getByText(id === "1" ? "귀얄 붓결과 유약" : "한지 선면 위의 매화", {
        exact: true,
      })
      .boundingBox();
    expect(photo!.x + photo!.width).toBeLessThanOrEqual(title!.x);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.querySelectorAll(".demo-preview img")].map((i) =>
          (i as HTMLImageElement).decode(),
        ),
      );
    });
    for (let i = 0; i < (await sections.count()); i++) {
      await sections.nth(i).screenshot({
        path: `artifacts/sections-${id}-${i + 1}.png`,
        style:
          ".demo-toolbar, .ss-header, nextjs-portal { visibility:hidden !important; }",
      });
    }
    await page
      .getByRole("button", { name: "최종 미리보기", exact: true })
      .click();
    await page.getByRole("button", { name: "모바일", exact: true }).click();
    await expect(page.locator(".demo-preview")).toBeVisible();
    await expect
      .poll(async () =>
        Math.round((await sections.first().boundingBox())!.width),
      )
      .toBe(360);
    const mobileGallery = await gallery.boundingBox();
    for (const img of await gallery.locator("img").all()) {
      const box = await img.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(mobileGallery!.x);
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        mobileGallery!.x + mobileGallery!.width + 1,
      );
    }
  });
}
