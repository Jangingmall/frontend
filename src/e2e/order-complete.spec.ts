import { expect, test } from "@playwright/test";

async function loginAsCustomer(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("로그인 고객이 일반 주문 완료 목업을 확인한다", async ({ page }) => {
  await loginAsCustomer(page);
  await page.goto("/checkout/ui-preview-order/complete?result=success");

  await expect(
    page.getByRole("heading", { name: "주문이 완료되었습니다" }),
  ).toBeVisible();
  await expect(
    page.getByText("장인이 주문을 확인한 후 제작을 시작할 예정입니다."),
  ).toBeVisible();
  await expect(page.getByText("가상계좌 정보")).toHaveCount(0);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "docs/screenshots/order-complete-success.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "주문 내역 보기" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "주문 내역은 준비 중입니다.",
  );
  await page.getByRole("button", { name: "계속 둘러보기" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("로그인 고객이 무통장입금 대기 목업을 확인한다", async ({ page }) => {
  await loginAsCustomer(page);
  await page.goto("/checkout/ui-preview-order/complete?result=bank-pending");

  await expect(page.getByText("가상계좌 정보")).toBeVisible();
  await expect(page.getByText("999,999,999원")).toBeVisible();
  await expect(page.getByText("NNNN.NN.NN 00:00까지")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "docs/screenshots/order-complete-bank-pending.png",
    fullPage: true,
  });
});

test("취소 결과와 다른 주문 ID는 완료 화면을 표시하지 않는다", async ({
  page,
}) => {
  await loginAsCustomer(page);

  await page.goto("/checkout/ui-preview-order/complete?result=cancelled");
  await expect(page.getByText("페이지를 찾을 수 없어요")).toBeVisible();

  await page.goto("/checkout/real-order/complete?result=success");
  await expect(page.getByText("페이지를 찾을 수 없어요")).toBeVisible();
});
