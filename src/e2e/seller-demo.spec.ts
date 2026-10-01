import { expect, test } from "@playwright/test";

import { startSellerDemo } from "./seller-demo-helpers";
for (const id of ["1", "2"]) {
  test(`seller demo ${id} reuses original input, editor, review and publication`, async ({
    page,
  }) => {
    const live: string[] = [];
    page.on("request", (req) => {
      if (
        /^\/api\/(content|products|images)(\/|$)/.test(
          new URL(req.url()).pathname,
        )
      )
        live.push(req.url());
    });
    await startSellerDemo(page, id);
    await page.locator(".sa-section-link").first().click();
    await page
      .getByLabel("문구 1", { exact: true })
      .fill("수정한 작품 이야기 " + id);
    await page
      .getByRole("dialog", { name: "내용 편집" })
      .getByRole("button", { name: "닫기", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "내용 편집" }),
    ).not.toBeVisible();
    await page.getByRole("button", { name: "임시저장", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("서버에 저장했습니다");
    await page.getByRole("button", { name: "서버 문서 다시 조회" }).click();
    await expect(page.getByRole("status")).toContainText("다시 불러왔습니다");
    await expect(page.locator(".sa-document")).toContainText(
      "수정한 작품 이야기 " + id,
    );
    await page
      .locator(".sa-section-link")
      .filter({ hasText: /사진$/ })
      .first()
      .click();
    await page
      .getByRole("dialog", { name: "내용 편집" })
      .locator("input[type=file]")
      .setInputFiles("public/seller-demos/1/hero.webp");
    await expect(page.locator(".sa-document img").first()).toHaveAttribute(
      "src",
      /\/api\/mock\/seller-demos\/[12]\/uploads\//,
      { timeout: 30000 },
    );
    await expect(
      page.getByRole("dialog", { name: "내용 편집" }).locator("fieldset"),
    ).toBeEnabled({ timeout: 30000 });
    await page
      .getByRole("dialog", { name: "내용 편집" })
      .getByRole("button", { name: "닫기", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "내용 편집" }),
    ).not.toBeVisible();
    await page.getByRole("button", { name: "임시저장", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("서버에 저장했습니다");
    await page
      .locator(".sa-document img")
      .first()
      .evaluate((image) => (image as HTMLImageElement).decode());
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await page.getByRole("button", { name: "임시저장", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("서버에 저장했습니다");
    await expect(page.locator(".sa-document img").first()).toHaveAttribute(
      "src",
      new RegExp(`/seller-demos/${id}/`),
    );
    await page.screenshot({
      path: `artifacts/shared-studio-${id}-editor.png`,
      fullPage: true,
      style: "nextjs-portal {visibility:hidden}",
    });
    await page
      .getByRole("button", { name: "최종 검토하기", exact: true })
      .click();
    await expect(page.locator(".ss-product-copy")).toContainText("120,000원");
    await page.getByRole("button", { name: "모바일", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "모바일", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "제작 완료하기" }).click();
    const dialog = page.getByRole("dialog", { name: "검수 및 게시" });
    await dialog.getByRole("button", { name: "저장하고 검수 요청" }).click();
    await dialog.getByLabel("내용이 사실과 일치합니다.").check();
    await dialog.getByLabel("사진이 실제 작품과 일치합니다.").check();
    await dialog.getByRole("button", { name: "확인하고 승인" }).click();
    await dialog
      .getByRole("button", { name: "콘텐츠 게시", exact: true })
      .click();
    await expect(dialog).toContainText("콘텐츠 게시 상태입니다.");
    expect(live).toEqual([]);
  });
}
test("unknown scenario is not found", async ({ page }) => {
  expect((await page.goto("/seller/products/new/3"))?.status()).toBe(404);
});
