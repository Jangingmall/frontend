import { expect, test } from "@playwright/test";
async function login(
  page: import("@playwright/test").Page,
  path = "/checkout/ui-preview-order",
) {
  await page.goto(`/login?returnUrl=${encodeURIComponent(path)}`);
  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(
      path.includes("fail") ? "/checkout/fail" : "/checkout/ui-preview-order",
    ),
  );
}
test("단일 이메일·복사·주소·메모·은행 안내를 검토한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await expect(page.getByRole("button", { name: "결제하기" })).toBeDisabled();
  await page.screenshot({
    path: "docs/screenshots/checkout-default.png",
    fullPage: true,
    style: "nextjs-portal, .fixed.z-100 { visibility: hidden; }",
  });
  await page.getByLabel("주문자 이름", { exact: true }).fill("홍길동");
  await page.getByLabel("주문자 이메일").fill("midam@example.com");
  await page.getByLabel("주문자 휴대전화 중간자리").fill("1234");
  await page.getByLabel("주문자 휴대전화 끝자리").fill("5678");
  await page.getByRole("checkbox", { name: "주문자 정보와 동일" }).check();
  await expect(page.getByLabel("수령인 이름", { exact: true })).toHaveValue(
    "홍길동",
  );
  await page.getByRole("button", { name: "주소검색" }).click();
  await expect(page.getByLabel("상세주소", { exact: true })).toBeFocused();
  await page.getByLabel("상세주소", { exact: true }).fill("101동 1234호");
  await page.getByRole("combobox", { name: "배송 메모" }).click();
  await page.getByRole("option", { name: "직접 입력", exact: true }).click();
  await page.getByLabel("배송메모 직접 입력").fill("배송 전 연락 바랍니다.");
  await page.getByRole("radio", { name: "무통장입금", exact: true }).check();
  await expect(
    page.getByText("입금 기한은 주말 및 공휴일을 포함하여 계산됩니다."),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "약관에 동의합니다." }).check();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/checkout-bank.png",
    fullPage: true,
    style: "nextjs-portal, .fixed.z-100 { visibility: hidden; }",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByLabel("주문자 이름", { exact: true })
    .scrollIntoViewIfNeeded();
  const form = page.getByRole("form", { name: "주문 결제" });
  const bounds = await form.boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(390);
  const phone = await page.getByLabel("주문자 휴대전화 끝자리").boundingBox();
  expect((phone?.x ?? 0) + (phone?.width ?? 0)).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/checkout-narrow.png",
    fullPage: true,
    style: "nextjs-portal, .fixed.z-100 { visibility: hidden; }",
  });
});
test("실패 진입에서 재시도 후 폼을 편집한다", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, "/checkout/fail?orderId=ui-preview-order&reason=timeout");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/checkout-timeout.png",
    fullPage: false,
    style: "nextjs-portal, .fixed.z-100 { visibility: hidden; }",
  });
  await page.getByRole("button", { name: "다시 시도" }).click();
  await page.getByLabel("주문자 이름", { exact: true }).fill("홍길동");
  await page.getByRole("radio", { name: "신용·체크카드", exact: true }).check();
  await expect(page.getByLabel("주문자 이름", { exact: true })).toHaveValue(
    "홍길동",
  );
});
