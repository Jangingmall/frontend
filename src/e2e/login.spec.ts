import { expect, test } from "@playwright/test";

/**
 * `(protected)` 그룹엔 아직 실제 page가 없어(레이아웃만 존재) 가드가 만드는 리다이렉트를
 * 실제로 왕복 검증할 방법이 없다. 대신 가드가 만드는 URL 형태
 * (`/login?returnUrl=${encodeURIComponent(pathname)}`)를 이미 존재하는 공개 라우트
 * (`/products`)로 직접 흉내 내 로그인 화면 자체의 동작만 검증한다.
 */
test("유효한 자격으로 로그인하면 returnUrl로 이동한다", async ({ page }) => {
  await page.goto("/login?returnUrl=%2Fproducts");

  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(page).toHaveURL(/\/products$/);
});

test("잘못된 자격이면 인라인 에러를 보여주고 이동하지 않는다", async ({
  page,
}) => {
  await page.goto("/login");

  await page
    .getByPlaceholder("이메일을 입력해주세요.")
    .fill("wrong@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("wrongpass");
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(
    page.getByText("아이디 또는 비밀번호를 확인해주세요!"),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
