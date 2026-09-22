import { expect, test } from "@playwright/test";

test("실제 백엔드 상세 → 카트 → 주문서와 미승인 완료 차단", async ({
  page,
}) => {
  test.setTimeout(90000);
  test.skip(
    !process.env.LIVE_API_EMAIL ||
      !process.env.LIVE_API_PASSWORD ||
      !process.env.LIVE_ORDER_ID,
    "별도 로컬 백엔드와 검증 계정이 필요합니다",
  );
  await page.goto("/login?returnUrl=%2Fproducts%2Ftest-1");
  await page
    .getByPlaceholder("이메일을 입력해주세요.")
    .fill(process.env.LIVE_API_EMAIL!);
  await page
    .getByPlaceholder("비밀번호를 입력해주세요.", { exact: true })
    .fill(process.env.LIVE_API_PASSWORD!);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "API 연동 검증 찻잔", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await page
    .getByRole("button", { name: "장바구니 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByRole("article", { name: "API 연동 검증 찻잔" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /건 구매하기/ }).click();
  await expect(
    page.getByRole("heading", { name: "주문 결제", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("API 연동 검증 찻잔", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.screenshot({
    path: "docs/screenshots/api86-live-checkout.png",
    fullPage: true,
  });
  await page.goto(
    `/checkout/${process.env.LIVE_ORDER_ID}/complete?result=success`,
  );
  await expect(page.getByText("결제 완료가 확인되지 않았습니다")).toBeVisible({
    timeout: 30000,
  });
  await page.goto(`/mypage/orders/${process.env.LIVE_ORDER_ID}`);
  await expect(
    page.getByText("API 연동 검증 찻잔", { exact: true }).first(),
  ).toBeVisible({ timeout: 30000 });
});
