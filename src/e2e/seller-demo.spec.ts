import { expect, test } from "@playwright/test";
for (const [scenario, title] of [
  ["1", "청자 분청 찻잔"],
  ["2", "전주 합죽선 매화선"],
]) {
  test(
    "seller demo " +
      scenario +
      " generates, edits, saves and previews without live seller API",
    async ({ page }) => {
      const live: string[] = [];
      page.on("request", (request) => {
        const p = new URL(request.url()).pathname;
        if (/^\/api\/(content|images|products)(\/|$)/.test(p)) live.push(p);
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/seller/products/new/" + scenario);
      await expect(page.getByLabel("상품명")).toHaveValue(title);
      await page.screenshot({
        path: "artifacts/seller-demo-" + scenario + "-input.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: "생성하기", exact: true }).click();
      await expect(
        page.getByRole("heading", {
          name: "AI가 상세페이지 초안을 만들고 있어요.",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "최종 미리보기", exact: true }),
      ).toBeVisible({ timeout: 20000 });
      await expect(page).toHaveURL(
        new RegExp("/seller/products/new/" + scenario + "$"),
      );
      const images = page.locator(".demo-preview img");
      await expect(images.first()).toBeVisible();
      expect(
        await images.evaluateAll((imgs) =>
          imgs.every((img) =>
            (img as HTMLImageElement).src.includes(
              "/seller-demos/" + location.pathname.split("/").at(-1) + "/",
            ),
          ),
        ),
      ).toBe(true);
      await page.getByLabel("수정할 텍스트").selectOption({ index: 1 });
      await page
        .getByLabel("텍스트 내용")
        .fill("수정한 작품 이야기 " + scenario);
      await page
        .getByRole("button", { name: "임시 저장", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("시연 초안을 저장");
      await page
        .getByRole("button", { name: "저장본 불러오기", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("불러왔습니다");
      await expect(page.getByLabel("텍스트 내용")).toHaveValue(
        "수정한 작품 이야기 " + scenario,
      );
      await page.screenshot({
        path: "artifacts/seller-demo-" + scenario + "-editor.png",
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "최종 미리보기", exact: true })
        .click();
      await page.getByRole("button", { name: "모바일", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "모바일", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .getByRole("button", { name: "제작 완료", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText(
        "실제 상품은 게시되지 않습니다",
      );
      expect(live).toEqual([]);
    },
  );
}
test("unknown demo is not found", async ({ page }) => {
  const res = await page.goto("/seller/products/new/3");
  expect(res?.status()).toBe(404);
});
