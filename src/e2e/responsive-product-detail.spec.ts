import { expect, type Page, test } from "@playwright/test";

const detailPath = "/products/백자-달항아리-101";

// 시안 실측: [뷰포트 폭, 구매 정보 열 폭, 2열 배치 여부]
const layouts = [
  { width: 1440, info: 522, twoColumns: true },
  { width: 1280, info: 375, twoColumns: true },
  { width: 1024, info: 304, twoColumns: true },
  { width: 768, info: 300, twoColumns: true },
  { width: 375, info: 327, twoColumns: false },
] as const;

async function openDetail(page: Page, width: number, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto(detailPath);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

for (const { width, info, twoColumns } of layouts) {
  test(`상세 레이아웃 ${width}px: ${twoColumns ? "갤러리와 구매 정보가 2열" : "1열"}이고 가로로 넘치지 않는다`, async ({
    page,
  }) => {
    await openDetail(page, width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);

    const gallery = page.getByRole("region", { name: "상품 이미지" });
    const aside = page.getByRole("complementary", {
      name: "상품 정보 및 구매",
    });
    const galleryBox = (await gallery.boundingBox())!;
    const asideBox = (await aside.boundingBox())!;
    expect(Math.abs(asideBox.width - info)).toBeLessThanOrEqual(1);
    if (twoColumns) {
      expect(asideBox.x).toBeGreaterThan(galleryBox.x + galleryBox.width - 1);
      expect(Math.abs(asideBox.y - galleryBox.y)).toBeLessThanOrEqual(1);
    } else {
      expect(asideBox.y).toBeGreaterThan(galleryBox.y + galleryBox.height - 1);
    }

    // 썸네일은 모든 폭에서 큰 이미지 왼쪽의 세로 열이다.
    const thumbs = (await gallery.locator("> div").boundingBox())!;
    const big = (await gallery
      .getByRole("button", { name: /이미지 확대/ })
      .boundingBox())!;
    expect(thumbs.x + thumbs.width).toBeLessThanOrEqual(big.x);
    expect(thumbs.height).toBeGreaterThan(thumbs.width);
  });
}

for (const width of [1280, 768]) {
  test(`구매 패널은 ${width}px에서 스크롤해도 GNB 아래에 붙어 있다`, async ({
    page,
  }) => {
    await openDetail(page, width, 700);
    const panel = page
      .getByRole("complementary", { name: "상품 정보 및 구매" })
      .locator("> div");
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect
      .poll(async () => Math.round((await panel.boundingBox())!.y))
      .toBeLessThanOrEqual(170);
    expect((await panel.boundingBox())!.y).toBeGreaterThanOrEqual(120);
  });
}

test("375px에서는 구매 패널이 화면에 붙지 않는다", async ({ page }) => {
  await openDetail(page, 375, 700);
  const panel = page
    .getByRole("complementary", { name: "상품 정보 및 구매" })
    .locator("> div");
  await page.evaluate(() => window.scrollTo(0, 600));
  expect((await panel.boundingBox())!.y).toBeLessThan(0);
});

test("섹션 탭은 375px에서 화면 폭 전체를 쓴다", async ({ page }) => {
  await openDetail(page, 375);
  const box = (await page
    .getByRole("navigation", { name: "상품 상세 메뉴" })
    .boundingBox())!;
  expect(box.x).toBe(0);
  expect(Math.round(box.width)).toBe(375);
});

for (const { width, scrolls } of [
  { width: 1440, scrolls: false },
  { width: 1280, scrolls: false },
  { width: 1024, scrolls: true },
  { width: 768, scrolls: true },
  { width: 375, scrolls: true },
]) {
  test(`작가의 다른 작품은 ${width}px에서 ${scrolls ? "가로 스크롤 행" : "3장이 한 줄"}이다`, async ({
    page,
  }) => {
    await openDetail(page, width);
    const row = page
      .getByRole("region", { name: "작가의 다른 작품" })
      .locator("> div");
    await row.scrollIntoViewIfNeeded();
    const overflows = await row.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    );
    expect(overflows).toBe(scrolls);
  });
}
