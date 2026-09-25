import { expect, test } from "@playwright/test";

test("구매 확정은 전체 주문 안내에 동의한 뒤 적용되고 목록에 반영된다", async ({
  page,
}) => {
  await page.goto("/login?returnUrl=%2Fmypage%2Forders%2F5004");
  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.getByRole("button", { name: "구매 확정", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "주문 전체를 구매 확정하시겠습니까?",
  });
  await expect(dialog).toContainText("포함된 모든 상품이 함께 구매 확정됩니다");
  await expect(dialog).toContainText("교환·환불을 신청할 수 없습니다");
  await page.screenshot({
    path: "docs/screenshots/api92-purchase-confirmation.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "취소", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "구매 확정", exact: true }).click();
  await dialog
    .getByRole("button", { name: "주문 전체 구매 확정", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "구매 확정", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "바로 구매하기", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "주문 상세보기" }).click();
  await page
    .getByRole("button", { name: "구매 확정", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/status=PURCHASE_CONFIRMED/);
  await expect(page.getByText(/ORD00000005004/).first()).toBeVisible();
});
