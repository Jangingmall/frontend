import { expect, type Page, test } from "@playwright/test";

const DARK_BODY_BG = "rgb(20, 20, 20)";
const LIGHT_BODY_BG = "rgb(255, 255, 255)";

const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains("dark"));

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

async function login(page: Page) {
  await page.goto("/login?returnUrl=%2F");
  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("banner").getByRole("link", { name: "마이페이지" }),
  ).toBeVisible();
}

test.describe("게스트: 기기 테마를 따른다", () => {
  test("기기가 다크면 첫 페인트 전 스크립트가 dark 를 붙이고 배경이 다크다", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    // 하이드레이션(React)이 끝나기 전 시점의 값 — 인라인 스크립트가 붙였는지 본다.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __darkAtDcl: boolean }).__darkAtDcl =
          document.documentElement.classList.contains("dark");
      });
    });

    await page.goto("/");

    expect(
      await page.evaluate(
        () => (window as unknown as { __darkAtDcl: boolean }).__darkAtDcl,
      ),
    ).toBe(true);
    expect(await bodyBackground(page)).toBe(DARK_BODY_BG);
  });

  test("기기가 라이트면 라이트다", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });

    await page.goto("/");

    expect(await isDark(page)).toBe(false);
    expect(await bodyBackground(page)).toBe(LIGHT_BODY_BG);
  });

  test("기기 테마를 바꾸면 새로고침 없이 반영된다", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "히어로", exact: true }),
    ).toBeVisible();
    // 부팅 복원 실패로 비로그인이 확정돼야(`anonymous`) 기기 테마 구독이 붙는다.
    await expect.poll(() => isDark(page)).toBe(false);

    await page.emulateMedia({ colorScheme: "dark" });

    await expect.poll(() => isDark(page)).toBe(true);
    expect(await bodyBackground(page)).toBe(DARK_BODY_BG);
  });
});

test.describe("로그인 사용자: 설정이 기기 테마보다 우선한다", () => {
  test("설정에서 다크모드를 켜면 다른 화면에서도 유지되고, 끄면 라이트로 돌아간다", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await login(page);

    await page.goto("/mypage/settings");
    const toggle = page.getByRole("switch", { name: "다크모드 변경" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect.poll(() => isDark(page)).toBe(true);

    // 다른 화면으로 이동해도(전체 새로고침 포함) 다크가 유지된다.
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "히어로", exact: true }),
    ).toBeVisible();
    expect(await isDark(page)).toBe(true);
    expect(await bodyBackground(page)).toBe(DARK_BODY_BG);

    await page.goto("/mypage/settings");
    await page.getByRole("switch", { name: "다크모드 변경" }).click();
    await expect.poll(() => isDark(page)).toBe(false);
  });

  test("기기가 다크여도 설정이 라이트면 라이트다", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await login(page);

    await expect.poll(() => isDark(page)).toBe(false);
  });
});
