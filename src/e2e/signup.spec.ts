import { expect, test } from "@playwright/test";

/**
 * 01(가입 수단 선택) → 02(정보 입력 + 이메일 인증 + 약관 동의) → 03(가입 완료) 전체 흐름.
 * 이메일 인증은 MSW placeholder 계약(design.md §0.1·§7-2) — 코드는
 * `api/member/mock/fixtures.ts`의 `SEED_VERIFICATION_CODE`와 일치해야 한다.
 */
test("가입 수단 선택부터 정보 입력·이메일 인증·약관 동의·제출까지 완료하면 가입 완료 화면에 도달한다", async ({
  page,
}) => {
  await page.goto("/signup");

  await page
    .getByRole("button", { name: "이메일,비밀번호로 가입하기" })
    .click();

  await page.getByPlaceholder("홍길동").fill("홍길동");
  await page
    .getByPlaceholder("example@email.com")
    .fill(`e2e-signup-${Date.now()}@midam.test`);
  await page.getByPlaceholder("비밀번호", { exact: true }).fill("Abcd1234!");
  await page.getByPlaceholder("비밀번호 확인").fill("Abcd1234!");
  const phoneBoxes = page.getByPlaceholder("0000");
  await phoneBoxes.nth(0).fill("1234");
  await phoneBoxes.nth(1).fill("5678");

  await page.getByRole("button", { name: "인증 메일 발송" }).click();
  await page.getByPlaceholder("인증코드를 입력해주세요").fill("123456");
  await page.getByRole("button", { name: "인증 확인" }).click();
  await expect(page.getByText("인증 완료")).toBeVisible();

  await page.getByRole("checkbox", { name: "전체 동의하기" }).click();
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page).toHaveURL(/\/signup\/complete/);
  // `getByText`는 Next.js route announcer(스크린리더용 안내, 같은 텍스트를 복제)까지
  // 매치해 strict mode violation이 난다 — heading role로 좁힌다.
  await expect(
    page.getByRole("heading", { name: "홍길동님의 가입을 환영합니다!" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "이전 페이지로 돌아가기" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("세션 없이 가입 완료 화면에 직접 접근하면 홈으로 이동한다", async ({
  page,
}) => {
  await page.goto("/signup/complete");

  await expect(page).toHaveURL(/\/$/);
});

/**
 * 카카오 소셜 추가정보 입력 — 목업이 인증된 이메일을 제공해 이메일 인증 단계를 생략한다
 * (이름·전화번호만 입력). 네이버(이메일 미제공) 케이스는 RTL(`SignupFlow.test.tsx`)로 이미
 * 충분히 검증돼 있어 대표 케이스 하나만 E2E로 둔다.
 */
test("카카오 버튼으로 가입하면 이메일 인증 없이 이름·전화번호만으로 가입이 완료된다", async ({
  page,
}) => {
  await page.goto("/signup");

  await page
    .getByRole("button", { name: "카카오톡으로 빠르게 가입하기" })
    .click();

  await expect(page.getByText("제공자가 인증한 이메일이에요.")).toBeVisible();
  await expect(page.getByPlaceholder("비밀번호")).toHaveCount(0);

  await page.getByPlaceholder("홍길동").fill("김소셜");
  const phoneBoxes = page.getByPlaceholder("0000");
  await phoneBoxes.nth(0).fill("1234");
  await phoneBoxes.nth(1).fill("5678");
  await page.getByRole("checkbox", { name: "전체 동의하기" }).click();
  await page.getByRole("button", { name: "가입하기" }).click();

  await expect(page).toHaveURL(/\/signup\/complete/);
  await expect(
    page.getByRole("heading", { name: "김소셜님의 가입을 환영합니다!" }),
  ).toBeVisible();
});
