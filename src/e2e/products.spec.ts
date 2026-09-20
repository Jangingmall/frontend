import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/products?category=kitchen");
  await expect(
    page.getByRole("heading", { name: "키친 · 다이닝", exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("총 140개의 검색 결과", { exact: true }),
  ).toBeVisible();
});

test("필터, 페이지, 뒤로가기 및 초기화", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "소재", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "목재", exact: true }).click();
  await expect(page).toHaveURL(/material=wood/);
  await expect(
    page.getByText("총 24개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "2 페이지", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator("article")).toHaveCount(4);
  await page.goBack();
  await expect(page.locator("article")).toHaveCount(20);
  await expect(
    page.getByRole("button", { name: "목재", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await expect(
    page.getByText("총 140개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/material=/);
});

test("정렬과 품절 제외를 새로고침 후에도 유지한다", async ({ page }) => {
  await page.getByRole("combobox", { name: "상품 정렬" }).click();
  await page.getByRole("option", { name: "높은 가격순" }).click();
  await expect(page).toHaveURL(/sort=price-desc/);
  await page.getByRole("checkbox", { name: "품절 상품 제외" }).check();
  await expect(page).toHaveURL(/excludeSoldOut=true/);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "상품 정렬" })).toContainText(
    "높은 가격순",
  );
  await expect(
    page.getByRole("checkbox", { name: "품절 상품 제외" }),
  ).toBeChecked();
  await expect(
    page.locator("article").getByText("품절", { exact: true }),
  ).toHaveCount(0);
});

test("결과가 없는 조건은 초기화할 수 있다", async ({ page }) => {
  await page.goto("/products?category=kitchen&minPrice=999999999");
  await expect(page.getByText("조건에 맞는 상품이 없어요")).toBeVisible();
  await page.getByRole("button", { name: "필터 초기화", exact: true }).click();
  await expect(
    page.getByText("총 140개의 검색 결과", { exact: true }),
  ).toBeVisible();
});

test("좁은 화면에서도 가로 스크롤 없이 필터를 쓴다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "가격대", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  const slider = page.getByRole("slider", { name: "최소 가격" });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(page).toHaveURL(/minPrice=1000/);
  await expect(page.getByText("1천 원", { exact: true })).toBeVisible();
  await expect(slider).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/minPrice=2000/);
  await expect(page.getByText("2천 원", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(slider).toHaveAttribute("aria-valuenow", "1000");
  await expect(page.getByText("1천 원", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("PL-3에서 경로를 따라 대분류로 복귀하고 TOP으로 이동한다", async ({
  page,
}) => {
  const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
  await expect(
    breadcrumb.getByRole("link", { name: "전체 카테고리" }),
  ).toHaveAttribute("href", "/products");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
    "전체 상품",
  );
  await expect(
    page.getByRole("button", { name: "키친 · 다이닝", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "다기 · 찻잔", exact: true }).click();
  await expect(page).toHaveURL(/category=kitchen-1/);
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
    "다기 · 찻잔",
  );
  await expect(page.getByRole("button", { name: "맨 위로" })).toBeVisible();
  await expect(page.getByText("AI CHAT", { exact: true })).toBeVisible();
  await breadcrumb.getByRole("link", { name: "키친 · 다이닝" }).click();
  await expect(page).toHaveURL(/category=kitchen$/);
  await expect(
    page.getByText("총 140개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "끝 페이지" })
    .scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "맨 위로" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("PL-3 종목 복수 선택·해제와 새로고침·히스토리 복원", async ({ page }) => {
  await page.goto("/products?category=kitchen-1&sort=price-desc&page=2");
  await page.getByRole("button", { name: "다기 · 찻잔", exact: true }).click();
  const first = page.getByRole("button", { name: "사기장", exact: true });
  const second = page.getByRole("button", { name: "유기장", exact: true });
  let documentRequests = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documentRequests++;
  });
  await first.click();
  await expect(page).not.toHaveURL(/page=/);
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(
    page.getByText("총 3개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await second.click();
  await expect(page).toHaveURL(/subcategory=1&subcategory=2/);
  await expect(
    page.getByText("총 6개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  expect(documentRequests).toBe(0);

  await page.reload();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("article")).toHaveCount(6);
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("article")).toHaveCount(3);
  await page.goBack();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("article")).toHaveCount(6);
  await page.goForward();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("article")).toHaveCount(3);
});

test("좁은 PL-3 화면에서 종목과 기존 필터를 함께 초기화한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(
    "/products?category=kitchen-1&subcategory=1&subcategory=2&material=ceramic&maxPrice=200000&hasGiftWrap=true&excludeSoldOut=true&sort=price-asc",
  );
  await expect(
    page.getByText("총 1개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "사기장" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "소재", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: "도자기", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await expect(page).toHaveURL(/\?category=kitchen-1&sort=price-asc$/);
  await expect(
    page.getByText("총 16개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "사기장" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.getByRole("button", { name: "유기장" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(
    page.getByRole("button", { name: "도자기", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("checkbox", { name: "선물 포장 가능" }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "품절 상품 제외" }),
  ).not.toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
