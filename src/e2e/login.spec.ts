import { expect, test } from "@playwright/test";

/** returnUrl이 포함된 진입에서도 로그인 완료 후 홈으로 이동한다. */
test("유효한 자격으로 로그인하면 홈으로 이동한다", async ({ page }) => {
  await page.goto("/login?returnUrl=%2Fproducts");

  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("region", { name: "히어로", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "마이페이지", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("banner")
      .getByRole("link", { name: "마이페이지", exact: true }),
  ).toBeVisible();
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
