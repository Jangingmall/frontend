import { expect, test } from "@playwright/test";

import { startSellerDemo } from "./seller-demo-helpers";

test("product preview uses the storefront layout at each device width", async ({
  page,
}) => {
  await startSellerDemo(page, "2");
  const consumerRequests: string[] = [];
  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/^\/(api\/|products(?:\/|$)|cart(?:\/|$)|login(?:\/|$))/.test(pathname))
      consumerRequests.push(pathname);
  });
  await page.getByRole("button", { name: "미리보기", exact: true }).click();
  const frame = page.frameLocator('iframe[title="상품 상세페이지 미리보기"]');
  const gallery = frame.getByRole("region", {
    name: "상품 이미지",
    exact: true,
  });
  const purchase = frame.getByRole("complementary", {
    name: "상품 정보 및 구매",
  });
  await expect(frame.locator(".sa-document > section")).toHaveCount(9);
  await expect(
    frame.getByRole("combobox", { name: "후기 정렬" }),
  ).toBeDisabled();
  for (const device of ["PC", "태블릿", "모바일"]) {
    await page.getByRole("button", { name: device, exact: true }).click();
    await expect
      .poll(async () => {
        const image = await gallery.boundingBox();
        const info = await purchase.boundingBox();
        if (!image || !info) return false;
        return device === "모바일"
          ? info.y >= image.y + image.height
          : info.x >= image.x + image.width && Math.abs(info.y - image.y) < 2;
      })
      .toBe(true);
  }
  await gallery
    .getByRole("button", { name: "2번 이미지 보기", exact: true })
    .click();
  await gallery.getByRole("button", { name: /이미지 확대$/ }).click();
  const lightbox = frame.getByRole("dialog", { name: "상품 이미지 확대" });
  await expect(lightbox).toBeVisible();
  await expect(lightbox).toContainText("2 / 6");
  await lightbox.press("ArrowRight");
  await expect(lightbox).toContainText("3 / 6");
  await lightbox.getByRole("button", { name: "닫기", exact: true }).click();
  const shipping = frame.getByRole("link", { name: "배송안내", exact: true });
  await shipping.click();
  await expect(shipping).toHaveAttribute("aria-current", "location");
  await expect(
    frame.getByRole("heading", { name: "배송안내", exact: true }),
  ).toBeInViewport();
  await expect(page).toHaveURL(/\/seller\/products\/new\/2$/);
  await page.getByRole("button", { name: /뒤로가기/ }).click();
  await expect(page.locator(".sa-document > section")).toHaveCount(9);
  expect(consumerRequests).toEqual([]);
});
