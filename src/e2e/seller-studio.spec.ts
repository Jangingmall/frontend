import path from "node:path";

import { expect, test } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.append(style);
    });
  });
});
test("Figma 입력에서 생성, 편집, 저장 복원, 최종 확인", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 994 });
  await page.goto("/seller/products/new");
  await expect(
    page.getByRole("heading", { name: "AI 상세페이지 제작" }),
  ).toBeVisible();
  await expect(page.locator(".ss-header")).toHaveCSS("height", "70px");
  await expect(page.locator(".ss-form-wrap")).toHaveCSS("max-width", "888px");
  await page.screenshot({
    path: "artifacts/seller-input.png",
    fullPage: true,
    caret: "initial",
  });
  await page
    .getByLabel("사진 첨부", { exact: true })
    .setInputFiles(path.resolve("public/studio/asset-1.png"));
  await expect(
    page.getByRole("button", { name: "1번 사진 삭제" }),
  ).toBeVisible();
  await page.getByLabel("상품명").fill("수제 찻잔");
  await page
    .getByLabel("제작 과정 · 상품 설명")
    .fill("손으로 빚어 구운 찻잔입니다.");
  await page
    .getByLabel("사용 · 보관 관리 방법")
    .fill("부드러운 천으로 닦아 보관하세요.");
  await page.getByRole("button", { name: "생성하기", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "AI가 상세페이지 초안을 만들고 있어요.",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/seller-generating.png",
    fullPage: true,
    caret: "initial",
  });
  await expect(
    page.getByRole("button", { name: "텍스트 편집", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/seller-editor.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("button", { name: "텍스트 편집", exact: true }).click();
  await page.getByLabel("섹션 제목", { exact: true }).fill("따뜻한 차 한 잔");
  await page.getByRole("button", { name: "편집 패널 닫기" }).click();
  await expect(page.locator(".ss-canvas h2").first()).toHaveText(
    "따뜻한 차 한 잔",
  );
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(page.locator(".ss-canvas h2").first()).toHaveText("수제 찻잔");
  await page.getByRole("button", { name: "다시 실행", exact: true }).click();
  await expect(page.locator(".ss-canvas h2").first()).toHaveText(
    "따뜻한 차 한 잔",
  );
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("이 브라우저에 저장됨");
  await page.reload();
  await expect(page.locator(".ss-canvas h2").first()).toHaveText(
    "따뜻한 차 한 잔",
  );
  await page.getByRole("button", { name: "제작 완료", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "태블릿", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/seller-review.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("button", { name: "모바일", exact: true }).click();
  await expect(page.locator(".ss-review-device")).toHaveCSS(
    "max-width",
    "390px",
  );
  await page.getByRole("button", { name: "제작 완료", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "실제 상품은 게시되지 않았습니다",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "태블릿", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("사진 제한과 손상된 저장 데이터, 좁은 화면", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/seller/products/new");
  await page
    .getByLabel("사진 첨부", { exact: true })
    .setInputFiles(Array(9).fill(path.resolve("public/studio/asset-1.png")));
  await expect(page.locator(".ss-shell").getByRole("alert")).toContainText(
    "최대 8장",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "artifacts/seller-input-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  await page.evaluate(() =>
    localStorage.setItem("midam-seller-figma-v1:broken", "{}"),
  );
  await page.goto("/seller/products/new?project=broken");
  await expect(page.locator(".ss-shell").getByRole("alert")).toContainText(
    "복원하지 못했습니다",
  );
});
test("시연 편집의 이미지 교체·순서·배치와 저장 실패 보호", async ({ page }) => {
  await page.goto("/seller/products/new?example=1");
  await page.getByRole("button", { name: "이미지 편집", exact: true }).click();
  await page
    .getByRole("button", { name: "금속 다기 디테일 예시 사용", exact: true })
    .click();
  await page.getByRole("button", { name: "편집 패널 닫기" }).click();
  await expect(page.locator(".ss-canvas img").first()).toHaveAttribute(
    "src",
    "/studio/asset-3.png",
  );
  await page.getByRole("button", { name: "페이지 아래로 이동" }).click();
  await page.getByRole("button", { name: "페이지 구성", exact: true }).click();
  await page.getByLabel("전체 배치").selectOption("image-first");
  await page.getByRole("button", { name: "페이지 추가", exact: true }).click();
  await expect(page.getByLabel("섹션 제목", { exact: true })).toHaveValue(
    "새 페이지",
  );
  await page.getByRole("button", { name: "편집 패널 닫기" }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("quota", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "제작 완료", exact: true }).click();
  await expect(page.locator(".ss-shell").getByRole("alert")).toContainText(
    "저장하지 못했습니다",
  );
  await expect(page.locator(".ss-canvas")).toBeVisible();
});

test("사진 8장에서도 교체·실행 취소가 가능하고 모바일 구성 도구를 연다", async ({
  page,
}) => {
  await page.goto("/seller/products/new?example=1");
  await page.getByRole("button", { name: "이미지 편집", exact: true }).click();
  await page
    .getByLabel("편집 사진 첨부", { exact: true })
    .setInputFiles(Array(6).fill(path.resolve("public/studio/asset-1.png")));
  await expect(
    page.getByRole("button", { name: "사진 첨부하기", exact: false }),
  ).toBeDisabled();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "선택 사진 교체", exact: true })
    .click();
  const chooser = await chooserPromise;
  await chooser.setFiles(path.resolve("public/studio/asset-3.png"));
  await expect(
    page.locator(".ss-canvas .cs-photo img").first(),
  ).toHaveAttribute("src", /^data:image/);
  await page.getByRole("button", { name: "편집 패널 닫기" }).click();
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(
    page.locator(".ss-canvas .cs-photo img").first(),
  ).toHaveAttribute("src", "/studio/asset-1.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "페이지 구성", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "페이지 추가", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "페이지 추가", exact: true }).click();
  await expect(page.getByLabel("섹션 제목", { exact: true })).toHaveValue(
    "새 페이지",
  );
});

test("사진 준비 중에는 이력 변경과 저장·완료를 기다린다", async ({ page }) => {
  await page.goto("/seller/products/new?example=1");
  await page.getByRole("button", { name: "이미지 편집", exact: true }).click();
  await page.evaluate(() => {
    const original = window.createImageBitmap;
    Object.defineProperty(window, "createImageBitmap", {
      configurable: true,
      value: async (image: ImageBitmapSource) => {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return original(image);
      },
    });
  });
  await page
    .getByLabel("편집 사진 첨부", { exact: true })
    .setInputFiles(path.resolve("public/studio/asset-1.png"));
  await expect(
    page.getByRole("button", { name: "임시 저장", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "제작 완료", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "실행 취소", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "임시 저장", exact: true }),
  ).toBeEnabled();
});
