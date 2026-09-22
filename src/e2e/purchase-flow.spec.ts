import { expect, test } from "@playwright/test";

test("상세 옵션과 수량을 담고 선택한 상품만 결제로 전달한다", async ({
  page,
}) => {
  await page.goto("/products/백자-달항아리-101");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "로그인", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "고객", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "마이페이지", exact: true }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "색상 (필수)" }).click();
  await page.getByRole("option", { name: "백색", exact: true }).click();
  await page.getByRole("option", { name: "소 (15 cm)", exact: true }).click();
  await page
    .getByRole("option", { name: "보자기 포장 (+3,000원)", exact: true })
    .click();
  await page.getByRole("button", { name: "증가", exact: true }).click();
  await page.getByRole("combobox", { name: "선물 포장 (선택)" }).click();
  await page.getByRole("option", { name: "선택 안 함", exact: true }).click();
  await expect(page.getByTestId("purchase-total")).toHaveText("66,000원");
  await page.getByRole("button", { name: "장바구니", exact: true }).click();
  await page
    .getByRole("button", { name: "장바구니 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cart$/);
  const cards = page.getByRole("article", {
    name: "백자 달항아리",
    exact: true,
  });
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("선물 포장: 보자기 포장");
  await expect(cards.first()).toContainText("46,000원");
  await cards.last().getByRole("checkbox").click();
  await page.getByRole("button", { name: "1건 구매하기", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/ui-preview-order$/);
  await expect(
    page.getByRole("heading", { name: "주문 결제", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("선물 포장: 보자기 포장", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("선물 포장: 선택 안 함", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "결제 정보" }),
  ).toContainText("46,000원");
});
