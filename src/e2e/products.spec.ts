import { expect, type Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/products?category=category-1");
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
  await page.goto("/products?category=category-1&minPrice=999999999");
  await expect(page.getByText("조건에 맞는 상품이 없어요")).toBeVisible();
  await page.getByRole("button", { name: "필터 초기화", exact: true }).click();
  await expect(
    page.getByText("총 140개의 검색 결과", { exact: true }),
  ).toBeVisible();
});

// 목업 계정 전환 오버레이(`.fixed.z-100`)가 모바일 시트 하단 버튼을 덮어 클릭을 가로챈다 —
// 결제 E2E와 같은 방식으로 숨긴다.
const hideMockSwitcher = (page: Page) =>
  page.addStyleTag({ content: ".fixed.z-100 { visibility: hidden; }" });

const hasNoHorizontalOverflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  );

test("좁은 화면에서도 가로 스크롤 없이 필터 시트로 가격을 바꾼다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await hideMockSwitcher(page);
  expect(await hasNoHorizontalOverflow(page)).toBe(true);
  // lg 미만에는 사이드바가 없고 [필터] 버튼으로 시트를 연다.
  await expect(
    page.getByRole("complementary", { name: "상품 필터" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "필터", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "필터" });
  await sheet.getByRole("button", { name: "가격대", exact: true }).click();
  const slider = sheet.getByRole("slider", { name: "최소 가격" });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(sheet.getByText("1천 원", { exact: true })).toBeVisible();
  // 시트 안 조작은 초안이다 — 확인 전에는 URL이 바뀌지 않는다.
  await expect(page).not.toHaveURL(/minPrice=/);
  await sheet.getByRole("button", { name: "확인", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/minPrice=1000/);
  await page.goBack();
  await expect(page).not.toHaveURL(/minPrice=/);
  expect(await hasNoHorizontalOverflow(page)).toBe(true);
});

test("필터 시트에서 소재를 골라 확인하면 결과가 갱신되고 닫기는 변경을 버린다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await hideMockSwitcher(page);
  await page.getByRole("button", { name: "필터", exact: true }).click();
  let sheet = page.getByRole("dialog", { name: "필터" });
  await sheet.getByRole("button", { name: "소재", exact: true }).click();
  await sheet.getByRole("button", { name: "목재", exact: true }).click();
  await sheet.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(page).not.toHaveURL(/material=/);
  await page.getByRole("button", { name: "필터", exact: true }).click();
  sheet = page.getByRole("dialog", { name: "필터" });
  await sheet.getByRole("button", { name: "소재", exact: true }).click();
  await expect(
    sheet.getByRole("button", { name: "목재", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await sheet.getByRole("button", { name: "목재", exact: true }).click();
  await sheet.getByRole("button", { name: "확인", exact: true }).click();
  await expect(page).toHaveURL(/material=wood/);
  await expect(
    page.getByText("총 24개의 검색 결과", { exact: true }),
  ).toBeVisible();
});

test("시트를 연 채 lg 이상으로 넓어지면 시트가 닫히고 사이드바가 보인다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.getByRole("button", { name: "필터", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "필터" })).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(page.getByRole("dialog", { name: "필터" })).toBeHidden();
  await expect(
    page.getByRole("complementary", { name: "상품 필터" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "필터", exact: true }),
  ).toBeHidden();
});

// 카테고리 목록(PL-2/3)은 고정 카드 폭 그리드, 분류 없는 목록(PL-1)은 유동 그리드 — 열 수는 같다.
const GRID_WIDTHS = [
  [375, 2],
  [768, 3],
  [1024, 3],
  [1280, 4],
  [1440, 4],
] as const;
for (const [path, label] of [
  ["/products?category=category-1", "카테고리 목록"],
  ["/products", "분류 없는 목록"],
] as const) {
  for (const [width, columns] of GRID_WIDTHS) {
    test(`${label}은 ${width}px에서 ${columns}열이고 가로로 넘치지 않는다`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator("article").first()).toBeVisible();
      const columnCount = await page
        .locator("article")
        .evaluateAll(
          (cards) =>
            new Set(
              cards.map((card) => Math.round(card.getBoundingClientRect().x)),
            ).size,
        );
      expect(columnCount).toBe(columns);
      expect(await hasNoHorizontalOverflow(page)).toBe(true);
      if (path.includes("category")) {
        // 보이는 필터 UI는 하나: lg 이상 사이드바 / 미만 [필터] 버튼.
        await expect(
          page.getByRole("complementary", { name: "상품 필터" }),
        ).toHaveCount(width >= 1024 ? 1 : 0);
        await expect(
          page.getByRole("button", { name: "필터", exact: true }),
        ).toHaveCount(width >= 1024 ? 0 : 1);
      }
    });
  }
}

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
  await expect(page).toHaveURL(/category=subcategory-1/);
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
    "다기 · 찻잔",
  );
  await expect(page.getByRole("button", { name: "맨 위로" })).toBeVisible();
  await expect(page.getByText("미담 챗봇", { exact: true })).toBeVisible();
  await breadcrumb.getByRole("link", { name: "키친 · 다이닝" }).click();
  await expect(page).toHaveURL(/category=category-1$/);
  await expect(
    page.getByText("총 140개의 검색 결과", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "끝 페이지" })
    .scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  // SSR로 그려진 버튼을 hydration 전에 누르면 핸들러가 없어 스크롤이 안 된다 — 동작할 때까지 재시도.
  await expect(async () => {
    await page.getByRole("button", { name: "맨 위로" }).click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 1500 })
      .toBe(0);
  }).toPass({ timeout: 10_000 });
});

test("PL-3 종목 복수 선택·해제와 새로고침·히스토리 복원", async ({ page }) => {
  await page.goto("/products?category=subcategory-1&sort=price-desc&page=2");
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

test("좁은 PL-3 화면에서 시트로 종목과 기존 필터를 함께 초기화한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(
    "/products?category=subcategory-1&subcategory=1&subcategory=2&material=ceramic&maxPrice=200000&hasGiftWrap=true&sort=price-asc",
  );
  await hideMockSwitcher(page);
  await page.getByRole("button", { name: "필터", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "필터" });
  // 선택된 종목은 접힌 시트에서도 펼쳐 보인다.
  await expect(sheet.getByRole("button", { name: "사기장" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await sheet.getByRole("button", { name: "소재", exact: true }).click();
  await expect(
    sheet.getByRole("button", { name: "도자기", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    sheet.getByRole("checkbox", { name: "선물 포장 가능" }),
  ).toBeChecked();
  await sheet.getByRole("button", { name: "초기화", exact: true }).click();
  // 초기화는 초안만 비운다 — 확인 전에는 URL이 그대로다.
  await expect(sheet.getByRole("button", { name: "사기장" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(
    sheet.getByRole("button", { name: "도자기", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    sheet.getByRole("checkbox", { name: "선물 포장 가능" }),
  ).not.toBeChecked();
  await expect(page).toHaveURL(/material=ceramic/);
  await sheet.getByRole("button", { name: "확인", exact: true }).click();
  // 분류·정렬만 남는다(파라미터 순서는 갱신 방식에 따라 달라질 수 있다).
  await expect
    .poll(() =>
      [...new URL(page.url()).searchParams.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("&"),
    )
    .toBe("category=subcategory-1&sort=price-asc");
  await expect(
    page.getByText("총 16개의 검색 결과", { exact: true }),
  ).toBeVisible();
  expect(await hasNoHorizontalOverflow(page)).toBe(true);
});
