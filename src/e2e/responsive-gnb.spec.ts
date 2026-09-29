import { expect, test } from "@playwright/test";

test.describe("모바일(375) GNB", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("햄버거 → 전체 카테고리 → 대분류를 누르면 해당 대분류 목록(PL-2)으로 이동한다", async ({
    page,
  }) => {
    await page.goto("/");

    // 데스크톱 내비는 숨겨지고 햄버거가 보인다.
    await expect(
      page.getByRole("navigation", { name: "글로벌 내비게이션" }),
    ).toBeHidden();
    await page.getByRole("button", { name: "메뉴 열기" }).click();

    const menu = page.getByRole("dialog", { name: "전체 메뉴" });
    await expect(menu).toBeVisible();
    await expect(
      menu.getByRole("link", { name: "로그인 / 회원가입" }),
    ).toBeVisible();

    await menu.getByRole("button", { name: "전체 카테고리" }).click();
    await menu.getByRole("button", { name: "뒤로가기" }).click();
    await menu.getByRole("button", { name: "전체 카테고리" }).click();
    await menu.getByRole("link", { name: /키친 · 다이닝/ }).click();

    await expect(page).toHaveURL(/\/products\?category=category-1$/);
    await expect(menu).toBeHidden();
  });

  test("메뉴를 연 채 화면을 데스크톱 폭으로 넓히면 메뉴가 닫힌다", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    await expect(page.getByRole("dialog", { name: "전체 메뉴" })).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 768 });

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "글로벌 내비게이션" }),
    ).toBeVisible();
  });
});

test.describe("데스크톱(1440) GNB", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("전체 카테고리에 올리면 메가패널이 열리고 소분류 링크가 분류 ID를 가진다", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "메뉴 열기" })).toBeHidden();

    await page.getByRole("link", { name: "전체 카테고리" }).hover();

    await expect(
      page.getByRole("link", { name: "다기 · 찻잔" }),
    ).toHaveAttribute("href", "/products?category=subcategory-1");
  });

  test("소분류 창은 소분류 개수와 상관없이 항상 같은 3열 폭이다", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "전체 카테고리" }).hover();

    const panelWidth = async (tab: RegExp) => {
      await page.getByRole("link", { name: tab }).first().hover();
      const grid = page.getByLabel(/소분류$/);
      await expect(grid).toBeVisible();
      return grid.evaluate((el) => el.getBoundingClientRect().width);
    };
    const kitchen = await panelWidth(/^키친 · 다이닝$/); // 소분류 9개 → 2열
    const fashion = await panelWidth(/^패션 · 액세서리$/); // 소분류 12개 → 3열
    const desk = await panelWidth(/^데스크 · 문구$/); // 소분류 5개 → 2열

    expect(kitchen).toBeGreaterThan(0);
    expect(fashion).toBeCloseTo(kitchen, 0);
    expect(desk).toBeCloseTo(kitchen, 0);
  });
});

test.describe("홈 가로 스크롤", () => {
  for (const width of [375, 768, 1024, 1280, 1440]) {
    test(`${width}px에서 페이지가 가로로 넘치지 않는다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(
        page.getByRole("region", { name: "히어로", exact: true }),
      ).toBeVisible();
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
