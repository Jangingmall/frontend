import { expect, type Page } from "@playwright/test";

/**
 * 헤더의 로그인/마이페이지 링크가 보이는지 확인한다. 모바일(md 미만)에서는 이 링크가 헤더가 아니라
 * 전체화면 메뉴 안에 있어서, 메뉴를 열어 확인하고 닫는다.
 */
export async function expectAuthLink(page: Page, name: string | RegExp) {
  const width = page.viewportSize()?.width ?? 1280;
  if (width >= 768) {
    await expect(
      page.getByRole("banner").getByRole("link", { name }),
    ).toBeVisible();
    return;
  }
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  const menu = page.getByRole("dialog", { name: "전체 메뉴" });
  // 메뉴의 비로그인 줄은 "로그인 / 회원가입"이다.
  const menuName =
    name instanceof RegExp ? /^(로그인 \/ 회원가입|마이페이지)$/ : name;
  await expect(menu.getByRole("link", { name: menuName })).toBeVisible();
  await page.getByRole("button", { name: "메뉴 닫기" }).click();
  await expect(menu).toBeHidden();
}
