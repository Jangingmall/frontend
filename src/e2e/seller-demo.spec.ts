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
    const text = pages.first().locator(".sd-editable-text").first();
    await text.fill("공통 편집기 복구 확인");
    await text.press("Tab");
    await text.click();
    await page
      .getByRole("button", { name: "오른쪽 정렬", exact: true })
      .click();
    await page.getByRole("button", { name: "굵게", exact: true }).click();
    await expect(text).toHaveCSS("text-align", "right");
    await page
      .getByRole("button", { name: "페이지 1 편집", exact: true })
      .click();
    await page
      .getByRole("button", { name: "라이트 그레이 배경", exact: true })
      .click();
    await expect(pages.first().locator(".sa-document > section")).toHaveCSS(
      "background-color",
      "rgb(250, 251, 252)",
    );

    // A previously selected gallery photo must not redirect the next page's image edit.
    const gallery = pages.nth(id === "1" ? 2 : 5);
    const gallerySource = await gallery
      .locator(".sa-document img")
      .nth(4)
      .getAttribute("src");
    await gallery.locator(".sa-document img").nth(4).click();
    await expect(
      page.getByRole("region", { name: "사진 편집", exact: true }),
    ).toBeVisible();
    const hero = pages.first().locator(".sa-document img");
    const originalPhoto = await hero.getAttribute("src");
    await hero.click();
    await page
      .getByRole("region", { name: "사진 편집", exact: true })
      .getByRole("button", { name: "사진 2로 교체", exact: true })
      .click();
    await expect(hero).not.toHaveAttribute("src", originalPhoto!);
    await expect(gallery.locator(".sa-document img").nth(4)).toHaveAttribute(
      "src",
      gallerySource!,
    );
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await expect(hero).toHaveAttribute("src", originalPhoto!);

    await page
      .getByRole("button", { name: "페이지 1 편집", exact: true })
      .click();
    await page
      .getByRole("button", { name: "페이지 복제", exact: true })
      .click();
    await expect(pages).toHaveCount(initialCount + 1);
    await expect(pages.nth(1)).toContainText("공통 편집기 복구 확인");
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await expect(pages).toHaveCount(initialCount);
    await page.getByRole("button", { name: "다시 실행", exact: true }).click();
    await expect(pages).toHaveCount(initialCount + 1);
    await page
      .getByRole("button", { name: "페이지 2 편집", exact: true })
      .click();
    await page
      .getByRole("button", { name: "페이지 아래로 이동", exact: true })
      .click();
    await expect(pages.nth(2)).toContainText("공통 편집기 복구 확인");
    await page
      .getByRole("button", { name: "페이지 위로 이동", exact: true })
      .click();
    await expect(pages.nth(1)).toContainText("공통 편집기 복구 확인");
    await page
      .getByRole("button", { name: "페이지 삭제", exact: true })
      .click();
    const deletion = page.getByRole("dialog", {
      name: "해당 내용을 삭제할까요?",
    });
    await expect(pages).toHaveCount(initialCount + 1);
    await deletion.getByRole("button", { name: "취소", exact: true }).click();
    await expect(pages).toHaveCount(initialCount + 1);
    await page
      .getByRole("button", { name: "페이지 삭제", exact: true })
      .click();
    await deletion.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(pages).toHaveCount(initialCount);

    await page
      .getByRole("button", { name: `페이지 ${initialCount} 편집`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "페이지 추가", exact: true })
      .click();
    await expect(page.locator(".sd-layout-grid button")).toHaveCount(6);
    await page
      .getByRole("button", { name: "새 영역 추가", exact: true })
      .click();
    await expect(pages).toHaveCount(initialCount + 1);
    await page.getByRole("button", { name: "사진 추가", exact: true }).click();
    const choices = page.locator(".ss-image-picker button");
    const beforeUpload = await choices.count();
    await page
      .getByLabel("편집 사진 첨부", { exact: true })
      .setInputFiles("public/seller-demos/1/hero.webp");
    await expect(choices).toHaveCount(beforeUpload + 1);
    await choices.last().click();
    await expect(pages.last().locator(".sa-document img")).toHaveCount(1);
    await pages.last().locator(".sa-document img").click();
    await page
      .getByRole("button", { name: "이미지 삭제하기", exact: true })
      .click();
    await expect(pages.last().locator(".sa-document img")).toHaveCount(0);
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await expect(pages.last().locator(".sa-document img")).toHaveCount(1);
    await page.getByRole("button", { name: "임시 저장", exact: true }).click();
    await expect(
      page.getByText("임시 저장되었습니다", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`/seller/products/new/${id}\\?draft=1$`),
    );
    await page.reload();
    await expect(pages).toHaveCount(initialCount + 1);
    await page.getByRole("button", { name: "도움말 닫기" }).click();
    await expect(pages.first()).toContainText("공통 편집기 복구 확인");
    await expect(pages.first().locator(".sd-editable-text").first()).toHaveCSS(
      "text-align",
      "right",
    );
    await expect(pages.last().locator(".sa-document img")).toHaveCount(1);
    await page.screenshot({ path: `artifacts/restored-frontend-${id}.png` });
    await expect(
      page.getByRole("button", { name: "제작 완료", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "미리보기", exact: true }).click();
    const preview = page.frameLocator(
      'iframe[title="상품 상세페이지 미리보기"]',
    );
    await expect(
      preview.getByRole("region", { name: "작품 구매 정보" }),
    ).toContainText("직접 입력한 작품명");
    await expect(
      preview.getByRole("region", { name: "작품 구매 정보" }),
    ).toContainText("10,000원");
    await page.getByRole("button", { name: "모바일", exact: true }).click();
    await expect(page.locator(".ss-review-device")).toHaveClass(/mobile/);
    await expect(
      page.getByRole("button", { name: "제작 완료", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "뒤로가기", exact: true }).click();
    await expect(pages).toHaveCount(initialCount + 1);
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
  const text = page.locator(".ss-page .sd-editable-text").first();
  await text.fill("이동 전 자동 저장");
  await text.press("Tab");
  await page
    .getByRole("link", { name: "판매 관리로 이동", exact: true })
    .click();
  await expect(page).toHaveURL(/\/seller\/products$/);
  await page.goto("/seller/products/new/1?draft=1");
  await expect(page.locator(".sa-document").first()).toContainText(
    "이동 전 자동 저장",
  );
});
