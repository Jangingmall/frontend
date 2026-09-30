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

/**
 * 설정 화면에서 다크모드를 원하는 값으로 맞춘다. 이미 그 값이면 아무것도 안 하고, 바꿀 때는 저장
 * 응답까지 기다린다 — 다크는 낙관적으로 즉시 반영되므로, 저장이 끝나기 전에 이동·종료하면 요청이
 * 취소돼 설정이 저장되지 않고 다음 테스트에 남는다(느린 CI에서 실제로 발생).
 */
async function setDarkMode(page: Page, on: boolean) {
  await page.goto("/mypage/settings");
  const toggle = page.getByRole("switch", { name: "다크모드 변경" });
  await expect(toggle).toBeVisible();
  const isOn = await toggle.evaluate((el) => el.hasAttribute("data-checked"));
  if (isOn === on) return;
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/api/member/settings"),
  );
  await toggle.click();
  await saved;
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

// 두 테스트가 같은 계정의 서버 쪽 설정(목업 상태)을 바꾸므로 병렬로 돌리지 않는다.
test.describe("로그인 사용자: 설정이 기기 테마보다 우선한다", () => {
  test.describe.configure({ mode: "serial" });

  test("설정에서 다크모드를 켜면 다른 화면에서도 유지되고, 끄면 라이트로 돌아간다", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    // 새로고침 직후 하이드레이션 전 시점의 값 — 저장값 캐시로 첫 페인트 전에 dark 가 붙는지 본다.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __darkAtDcl: boolean }).__darkAtDcl =
          document.documentElement.classList.contains("dark");
      });
    });
    await login(page);
    await setDarkMode(page, false); // 시작 상태를 고정한다.

    await setDarkMode(page, true);
    await expect.poll(() => isDark(page)).toBe(true);

    // 다른 화면으로 이동해도(전체 새로고침 포함) 다크가 유지된다.
    await page.goto("/");
    expect(
      await page.evaluate(
        () => (window as unknown as { __darkAtDcl: boolean }).__darkAtDcl,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("region", { name: "히어로", exact: true }),
    ).toBeVisible();
    await expect.poll(() => isDark(page)).toBe(true);
    expect(await bodyBackground(page)).toBe(DARK_BODY_BG);

    await setDarkMode(page, false);
    await expect.poll(() => isDark(page)).toBe(false);
  });

  test("기기가 다크여도 설정이 라이트면 라이트다", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await login(page);
    await setDarkMode(page, false);

    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "히어로", exact: true }),
    ).toBeVisible();

    await expect.poll(() => isDark(page)).toBe(false);
    expect(await bodyBackground(page)).toBe(LIGHT_BODY_BG);
  });
});
