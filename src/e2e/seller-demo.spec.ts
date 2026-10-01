import { expect, test } from "@playwright/test";

import { startSellerDemo } from "./seller-demo-helpers";

for (const id of ["1", "2"]) {
  test(`full frontend studio on MSW scenario ${id}`, async ({ page }) => {
    const realRequests: string[] = [];
    page.on("request", (request) => {
      if (
        /^\/api\/(products|content|images)\b/.test(
          new URL(request.url()).pathname,
        )
      )
        realRequests.push(request.url());
    });
    await startSellerDemo(page, id, "직접 입력한 작품명");
    const initialCount = id === "1" ? 8 : 9;
    const pages = page.locator(".ss-canvas > .ss-page");
    await expect(pages).toHaveCount(initialCount);
    await page
      .getByRole("button", { name: "페이지 1 편집", exact: true })
      .click();
    await page
      .getByLabel("섹션 제목", { exact: true })
      .fill("원래 편집기 복구 확인");
    await page
      .getByRole("button", { name: "오른쪽 정렬", exact: true })
      .click();
    await page.getByRole("button", { name: "굵게", exact: true }).click();
    await page.getByRole("button", { name: "soft 배경", exact: true }).click();
    await expect(pages.first().locator(".sa-document")).toContainText(
      "원래 편집기 복구 확인",
    );
    // 갤러리 사진 선택이 다른 페이지의 사진 편집에 영향을 주면 안 됩니다.
    await page
      .getByRole("button", {
        name: `페이지 ${id === "1" ? 3 : 6} 편집`,
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "이미지 편집", exact: true })
      .click();
    await page.getByLabel("편집할 사진", { exact: true }).selectOption("4");
    await page
      .getByRole("button", { name: "페이지 1 편집", exact: true })
      .click();
    await page
      .getByRole("button", { name: "이미지 편집", exact: true })
      .click();
    const originalPhoto = await pages
      .first()
      .locator(".sa-document img")
      .getAttribute("src");
    await page.locator(".ss-image-picker button").nth(1).click();
    await expect(pages.first().locator(".sa-document img")).not.toHaveAttribute(
      "src",
      originalPhoto!,
    );
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await page
      .getByRole("button", { name: "텍스트 편집", exact: true })
      .click();
    await page
      .getByRole("button", { name: "페이지 복제", exact: true })
      .click();
    await expect(pages).toHaveCount(initialCount + 1);
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await expect(pages).toHaveCount(initialCount);
    await page.getByRole("button", { name: "다시 실행", exact: true }).click();
    await expect(pages).toHaveCount(initialCount + 1);
    await page
      .getByRole("button", {
        name: `페이지 ${initialCount + 1} 편집`,
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "페이지 위로 이동", exact: true })
      .click();
    await page
      .getByRole("button", { name: "페이지 삭제", exact: true })
      .click();
    await expect(pages).toHaveCount(initialCount);
    await page
      .getByRole("button", { name: "페이지 구성", exact: true })
      .click();
    await page
      .getByRole("button", { name: "페이지 추가", exact: true })
      .click();
    await expect(pages).toHaveCount(initialCount + 1);
    await page
      .getByRole("button", { name: "이미지 편집", exact: true })
      .click();
    await page
      .getByLabel("편집 사진 첨부", { exact: true })
      .setInputFiles("public/seller-demos/1/hero.webp");
    await expect(
      page.getByRole("button", { name: "hero.webp 사용", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "hero.webp 사용", exact: true })
      .click();
    await expect(
      pages.last().locator("img").filter({ visible: true }),
    ).not.toHaveCount(0);
    await page
      .getByRole("button", { name: "이미지 삭제하기", exact: true })
      .click();
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await page.getByRole("button", { name: "임시 저장", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`/seller/products/new/${id}\\?draft=1$`),
    );
    await page.reload();
    await expect(page.locator(".ss-canvas > .ss-page")).toHaveCount(
      initialCount + 1,
    );
    await page.getByRole("button", { name: "도움말 닫기" }).click();
    await expect(page.locator(".sa-document").first()).toContainText(
      "원래 편집기 복구 확인",
    );
    await page.screenshot({ path: `artifacts/restored-frontend-${id}.png` });
    await page.getByRole("button", { name: "제작 완료", exact: true }).click();
    await expect(page.locator(".ss-product-copy h1")).toHaveText(
      "직접 입력한 작품명",
    );
    await expect(page.locator(".ss-product-copy strong")).toHaveText(
      "120,000원",
    );
    await page.getByRole("button", { name: "모바일", exact: true }).click();
    await expect(page.locator(".ss-review-device")).toHaveClass(/mobile/);
    await page.getByRole("button", { name: "제작 완료", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("제작 완료본");
    expect(realRequests).toEqual([]);
  });
}
test("unknown scenario is 404", async ({ page }) => {
  const response = await page.goto("/seller/products/new/3");
  expect(response?.status()).toBe(404);
});

test("header navigation saves current edits before leaving", async ({
  page,
}) => {
  await startSellerDemo(page, "1");
  await page
    .getByRole("button", { name: "페이지 1 편집", exact: true })
    .click();
  await page.getByLabel("섹션 제목", { exact: true }).fill("이동 전 자동 저장");
  await page
    .getByRole("link", { name: "판매 관리로 이동", exact: true })
    .click();
  await expect(page).toHaveURL(/\/seller\/products$/);
  await page.goto("/seller/products/new/1?draft=1");
  await expect(page.locator(".sa-document").first()).toContainText(
    "이동 전 자동 저장",
  );
});
