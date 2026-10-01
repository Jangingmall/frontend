import { expect, type Page, test } from "@playwright/test";

async function restore(page: Page, snapshot: unknown) {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/seller/products/new/1");
  await page.evaluate((value) => {
    localStorage.setItem("midam-seller-demo-frontend-1", JSON.stringify(value));
  }, snapshot);
  await page.goto("/seller/products/new/1?draft=1");
  await expect(
    page.getByRole("button", { name: "미리보기", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "도움말 닫기" }).click();
}

const product = {
  productId: 1,
  title: "저장한 작품",
  price: 120000,
  stock: 5,
  status: "DRAFT",
};
const document = {
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: [
    {
      id: "original-section",
      type: "element",
      tag: "section",
      props: { style: { padding: 40, backgroundColor: "#eee9df" } },
      children: [
        {
          id: "title",
          type: "element",
          tag: "h2",
          children: [{ id: "title-text", type: "text", value: "원본 제목" }],
        },
        {
          id: "paragraph",
          type: "element",
          tag: "p",
          props: { style: { fontSize: 16, color: "#414954" } },
          children: [
            { id: "target-text", type: "text", value: "수정할 문구" },
            { id: "line-break", type: "element", tag: "br" },
            {
              id: "neighbor-text",
              type: "text",
              value: "같은 문단의 유지할 문구",
            },
          ],
        },
        {
          id: "photo",
          type: "element",
          tag: "img",
          props: { imageId: "asset-1", alt: "원본 사진" },
        },
      ],
    },
  ],
};

test("raw snapshot preserves all 32 assets and formats only the selected text", async ({
  page,
}) => {
  const images = Object.fromEntries(
    Array.from({ length: 32 }, (_, index) => [
      `asset-${index + 1}`,
      `/seller-demos/1/hero.webp?photo=${index + 1}`,
    ]),
  );
  await restore(page, {
    format: "document-v1",
    document,
    images,
    product,
    productId: 1,
    review: false,
  });
  const target = page.locator('[data-node-id="target-text"]');
  const neighbor = page.locator('[data-node-id="neighbor-text"]');
  await target.click();
  await expect(page.getByLabel("글꼴 크기").locator("option")).toHaveCount(6);
  await page.getByLabel("글꼴 크기").selectOption("headline");
  await page.getByRole("button", { name: "오른쪽 정렬", exact: true }).click();
  await page
    .getByRole("button", { name: "화이트 글자색", exact: true })
    .click();
  await expect(target).toHaveCSS("font-size", "28px");
  await expect(target).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(target).toHaveCSS("text-align", "right");
  await expect(neighbor).toHaveCSS("font-size", "16px");
  await expect(neighbor).toHaveCSS("color", "rgb(65, 73, 84)");
  await expect(neighbor).not.toHaveCSS("text-align", "right");
  await target.fill("개별 문구 수정 완료");
  await target.press("Tab");
  await page
    .getByRole("button", { name: "페이지 1 편집", exact: true })
    .click();
  await expect(page.locator('.ss-swatch[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "사진 추가", exact: true }).click();
  await expect(page.locator(".ss-image-picker button")).toHaveCount(32);
  await page.locator(".sa-document img").click();
  const photoPanel = page.getByRole("region", {
    name: "사진 편집",
    exact: true,
  });
  await expect(
    photoPanel.getByRole("button", { name: /^사진 \d+로 교체$/ }),
  ).toHaveCount(32);
  await photoPanel
    .getByRole("button", { name: "사진 32로 교체", exact: true })
    .click();
  await expect(page.locator(".sa-document img")).toHaveJSProperty(
    "src",
    new URL(images["asset-32"], page.url()).href,
  );
  await page
    .getByLabel("편집 사진 첨부")
    .setInputFiles("public/seller-demos/1/hero.webp");
  await expect(
    page.getByRole("alert").filter({ hasText: "최대 32장" }),
  ).toBeVisible();
  await expect(page.locator(".ss-image-picker button")).toHaveCount(32);
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(
    page.getByText("임시 저장되었습니다", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "도움말 닫기" }).click();
  await expect(target).toHaveText("개별 문구 수정 완료");
  await expect(target).toHaveCSS("font-size", "28px");
  await expect(neighbor).toHaveText("같은 문단의 유지할 문구");
  await expect(neighbor).toHaveCSS("font-size", "16px");
  await expect(page.locator(".sa-document img")).toHaveJSProperty(
    "src",
    new URL(images["asset-32"], page.url()).href,
  );
  await page.getByRole("button", { name: "사진 추가", exact: true }).click();
  await expect(page.locator(".ss-image-picker button")).toHaveCount(32);
});

test("legacy demo draft migrates without dropping edited text or photos", async ({
  page,
}) => {
  const photo = "/seller-demos/1/hero.webp";
  const source = structuredClone(document);
  source.root[0].children[2].props = { imageId: photo, alt: "이전 사진" };
  await restore(page, {
    source,
    product,
    status: "editing",
    assets: [
      {
        imageId: photo,
        url: photo,
        width: 774,
        height: 774,
        alt: "이전 사진",
        asset_mode: "source",
        product_generated: false,
        fidelity_status: "VERIFIED",
      },
    ],
    draft: {
      product_name: product.title,
      product_type: null,
      summary: "저장 요약",
      hero_headline: "이전 제목",
      hero_description: "이전 설명",
      usage_scene: "",
      features: [],
      keywords: [],
      layout_id: "editorial-split",
      page_plan: [
        {
          section_id: "legacy-page",
          sourceSectionId: "original-section",
          block_type: "hero",
          eyebrow: "이전 저장 첫 문구",
          title: "이전 저장 둘째 문구",
          body: "이전 저장 셋째 문구",
          variant: "paper",
          photo_id: photo,
          photo_ids: [photo],
          items: [],
        },
      ],
    },
  });
  await expect(page.locator(".sa-document")).toContainText("이전 저장 첫 문구");
  await expect(page.locator(".sa-document")).toContainText(
    "이전 저장 둘째 문구",
  );
  await expect(page.locator(".sa-document")).toContainText(
    "이전 저장 셋째 문구",
  );
  await expect(page.locator(".sa-document img")).toHaveJSProperty(
    "src",
    new URL(photo, page.url()).href,
  );
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(
    page.getByText("임시 저장되었습니다", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("midam-seller-demo-frontend-1")!)
          .format,
    ),
  ).toBe("document-v1");
  await page.reload();
  await expect(page.locator(".sa-document")).toContainText(
    "이전 저장 둘째 문구",
  );
});

test("all six page layouts and added text survive save and reload", async ({
  page,
}) => {
  await restore(page, {
    format: "document-v1",
    document,
    images: { "asset-1": "/seller-demos/1/hero.webp" },
    product,
    productId: 1,
    review: false,
  });
  const pages = page.locator(".ss-canvas > .ss-page");
  for (const [index, label] of [
    "텍스트",
    "텍스트 + 오른쪽 사진",
    "왼쪽 사진 + 텍스트",
    "사진 1개",
    "사진 2개",
    "사진 3개",
  ].entries()) {
    await page
      .getByRole("button", { name: `페이지 ${index + 1} 편집`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "페이지 추가", exact: true })
      .click();
    await page
      .locator(".sd-layout-grid")
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(pages).toHaveCount(index + 2);
    await expect(pages.last().locator(".sa-image-missing")).toHaveCount(
      [0, 1, 1, 1, 2, 3][index],
    );
  }
  await page.getByRole("button", { name: "텍스트 추가", exact: true }).click();
  await page.getByRole("button", { name: "캡션 추가", exact: true }).click();
  const caption = pages.last().locator(".sd-editable-text").last();
  await caption.fill("레이아웃에 추가한 캡션");
  await caption.press("Tab");
  await caption.click();
  await expect(caption).toHaveCSS("font-size", "10px");
  await page.getByRole("button", { name: "텍스트 삭제", exact: true }).click();
  await expect(pages.last()).not.toContainText("레이아웃에 추가한 캡션");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(pages.last()).toContainText("레이아웃에 추가한 캡션");
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(
    page.getByText("임시 저장되었습니다", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(pages).toHaveCount(7);
  await expect(pages.last()).toContainText("레이아웃에 추가한 캡션");
  await expect(pages.last().locator(".sa-image-missing")).toHaveCount(3);
});

test("input enforces 15/100/100 characters and at most eight photos", async ({
  page,
}) => {
  await page.goto("/seller/products/new/1");
  for (const [label, limit] of [
    ["상품명", 15],
    ["제작 과정 · 상품 설명", 100],
    ["사용 · 보관 관리 방법", 100],
  ] as const) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toHaveAttribute("maxlength", String(limit));
    await field.fill("가".repeat(limit + 1));
    await expect(field).toHaveValue("가".repeat(limit));
  }
  await page
    .getByLabel("사진 첨부", { exact: true })
    .setInputFiles(Array(7).fill("public/seller-demos/1/hero.webp"));
  await expect(page.locator(".ss-thumbnails > div")).toHaveCount(8);
  await page.getByRole("button", { name: "사진 추가", exact: true }).click();
  await expect(
    page.getByText("사진은 최대 8장까지 첨부할 수 있습니다.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ss-thumbnails > div")).toHaveCount(8);
  await page.getByLabel("상품명", { exact: true }).fill(" ");
  await page.getByRole("button", { name: "생성하기", exact: true }).click();
  await expect(page.getByLabel("상품명", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByRole("dialog", { name: "상품 기본정보" })).toHaveCount(
    0,
  );
});
