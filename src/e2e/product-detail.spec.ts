import { expect, type Page, test } from "@playwright/test";

const detailPath = "/products/백자-달항아리-101";

async function openDetail(page: Page, path = detailPath) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "고객", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "마이페이지", exact: true }),
  ).toBeVisible();
}

test("찜 로그인 안내에서 로그인하고 원래 상품으로 복귀한다", async ({
  page,
}) => {
  await page.goto(detailPath);
  await page.getByRole("button", { name: "찜하기", exact: true }).click();
  const modal = page.getByRole("dialog", {
    name: "로그인 후 이용 가능한 서비스입니다",
  });
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "로그인하기", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(encodeURI(detailPath)));
});

test("비회원 문의는 로그인으로 바로 이동하고 상품 복귀 경로를 전달한다", async ({
  page,
}) => {
  await page.goto(detailPath);
  await page.getByRole("button", { name: "문의하기", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  const url = new URL(page.url());
  expect(decodeURI(url.searchParams.get("returnUrl")!)).toBe(detailPath);
});

async function chooseOptions(page: Page, color = "백색") {
  await page
    .getByRole("combobox", { name: "색상 (필수)", exact: true })
    .click();
  await page.getByRole("option", { name: color, exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "크기 (필수)", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("option", { name: "소 (15 cm)", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "선물 포장 (선택)", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("option", { name: "선택 안 함", exact: true }).click();
}

test("목록에서 상세로 이동하고 뒤로가면 목록 조건이 남는다", async ({
  page,
}) => {
  await page.goto("/products?category=kitchen&material=ceramic");
  await page.getByRole("link", { name: "백자 달항아리", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "백자 달항아리" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("백자 달항아리 | 장인몰");
  await page.goBack();
  await expect(page).toHaveURL(/material=ceramic/);
  await expect(
    page.getByRole("heading", { name: "키친 · 다이닝", exact: true, level: 1 }),
  ).toBeVisible();
});

test("한글 URL 직접 접속·새로고침·이전 제목 정규화", async ({ page }) => {
  await openDetail(page, "/products/이전-상품명-101");
  await expect(page).toHaveURL(new RegExp(encodeURI(detailPath)));
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "백자 달항아리" }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    new RegExp(encodeURI(detailPath)),
  );
});

test("섹션 링크 직접 진입과 뒤로가기가 메뉴에 반영된다", async ({ page }) => {
  await openDetail(page, `${detailPath}#product-reviews`);
  const nav = page.getByRole("navigation", { name: "상품 상세 메뉴" });
  const reviews = nav.getByRole("link", { name: "리뷰·문의" });
  const shipping = nav.getByRole("link", { name: "배송안내" });
  await expect(reviews).toHaveAttribute("aria-current", "location");
  await shipping.click();
  await expect(page).toHaveURL(/#product-shipping$/);
  await expect(shipping).toHaveAttribute("aria-current", "location");
  await page.goBack();
  await expect(page).toHaveURL(/#product-reviews$/);
  await expect(reviews).toHaveAttribute("aria-current", "location");
  await expect(shipping).not.toHaveAttribute("aria-current");
});

test("갤러리 전환과 라이트박스 키보드·경계·포커스 복귀", async ({ page }) => {
  await openDetail(page);
  await page
    .getByRole("button", { name: "3번 이미지 보기", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "3번 이미지 보기", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const trigger = page.getByRole("button", {
    name: "백자 달항아리 이미지 확대",
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "상품 이미지 확대" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "3번 확대 이미지 보기" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(
    dialog.getByRole("button", { name: "2번 확대 이미지 보기" }),
  ).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "6번 확대 이미지 보기" }).click();
  await expect(
    dialog.getByRole("button", { name: "다음 이미지" }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("필수 옵션 검증·조합별 수량·합계·삭제·장바구니", async ({ page }) => {
  await openDetail(page);
  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "색상 (필수)", exact: true }),
  ).toBeFocused();
  await chooseOptions(page);
  await page.getByRole("button", { name: "증가", exact: true }).click();
  await expect(page.getByTestId("purchase-total")).toHaveText("40,000원");
  await chooseOptions(page, "미색 (+2,000원)");
  await expect(page.getByTestId("purchase-total")).toHaveText("62,000원");
  await page.getByRole("button", { name: /백색.*삭제/ }).click();
  await expect(page.getByTestId("purchase-total")).toHaveText("22,000원");
  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "장바구니에 작품을 담았습니다." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "이미 장바구니에 담긴 작품입니다." }),
  ).toBeVisible();
});

test("품절·재고 누락·빈 후기 상태", async ({ page }) => {
  await openDetail(page, "/products/상품-103");
  await expect(
    page.getByRole("button", { name: "품절", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "재입고 알림", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "재입고 알림을 신청했습니다." }),
  ).toBeVisible();
  await openDetail(page, "/products/상품-106");
  await expect(
    page.getByRole("button", { name: "구매하기", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("재고를 확인 중입니다.")).toBeVisible();
  await openDetail(page, "/products/상품-102");
  await expect(page.getByText("등록된 후기가 없습니다.")).toBeVisible();
  await expect(page.getByText("등록된 문의가 없습니다.")).toBeVisible();
});

test("후기 페이지·사진 필터·별점 정렬", async ({ page }) => {
  await openDetail(page);
  const reviews = page.locator("#product-reviews");
  await expect(reviews.locator("article")).toHaveCount(5);
  await reviews.getByRole("button", { name: "2 페이지", exact: true }).click();
  await expect(page).toHaveURL(/reviewPage=2/);
  await expect(reviews.locator("article")).toHaveCount(5);
  await reviews
    .getByRole("checkbox", { name: "사진 후기만 보기", exact: true })
    .check();
  await expect(page).toHaveURL(/reviewPage=1/);
  await expect(reviews.locator("article")).toHaveCount(5);
  await reviews.getByRole("combobox", { name: "후기 정렬" }).click();
  await page.getByRole("option", { name: "별점 낮은 순" }).click();
  await expect(page).toHaveURL(/reviewSort=low/);
  await expect(
    reviews.getByRole("combobox", { name: "후기 정렬" }),
  ).toContainText("별점 낮은 순");
});

test("문의 작성·기타 제목·비밀글·등록 후 전체 목록 갱신", async ({ page }) => {
  await openDetail(page);
  await page.getByRole("button", { name: "문의하기", exact: true }).click();
  const form = page.getByRole("dialog", { name: "상품 문의하기" });
  await expect(form).toBeVisible();
  await expect
    .poll(() =>
      form
        .locator("img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await form.getByRole("button", { name: "등록하기" }).click();
  await expect(form.getByRole("alert")).not.toHaveCount(0);
  await form.getByRole("combobox", { name: "문의 유형" }).click();
  await page.getByRole("option", { name: "기타", exact: true }).click();
  await form.getByLabel("문의 제목 *").fill("포장 재료 문의");
  await form.getByLabel("내용 *").fill("포장에 사용되는 재료를 알고 싶습니다.");
  await form
    .getByRole("checkbox", { name: "비밀글 설정", exact: true })
    .check();
  await form.getByRole("button", { name: "등록하기" }).click();
  await expect(form).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "문의 (9)", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "문의 전체보기", exact: true })
    .click();
  const all = page.getByRole("dialog", { name: /문의 전체/ });
  await expect(all.getByText("포장 재료 문의", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(all).not.toBeVisible();
});

test("잘못된 상품과 서버 오류는 다른 복구 화면을 표시한다", async ({
  page,
}) => {
  await page.goto("/products/없는-상품-999");
  await expect(
    page.getByRole("heading", { name: "상품을 찾을 수 없습니다" }),
  ).toBeVisible();
  await page.goto("/products/잘못된-0");
  await expect(
    page.getByRole("heading", { name: "상품을 찾을 수 없습니다" }),
  ).toBeVisible();
  await page.goto("/products/오류-997");
  await expect(page.getByText("상품 정보를 불러오지 못했습니다")).toBeVisible();
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(page.getByText("상품 정보를 불러오지 못했습니다")).toBeVisible();
});

test("좁은 화면에서 옵션·모달을 사용해도 가로로 넘치지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openDetail(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await chooseOptions(page);
  await expect(page.getByTestId("purchase-total")).toHaveText("20,000원");
  await page.getByRole("button", { name: "문의하기", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "상품 문의하기" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 320, height: 800 });
  const modal = page.getByRole("dialog", { name: "상품 문의하기" });
  expect(
    await modal.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  const submitBox = await modal
    .getByRole("button", { name: "등록하기" })
    .boundingBox();
  expect(submitBox && submitBox.x + submitBox.width <= 320).toBe(true);
});
