import { expect, test } from "@playwright/test";

/**
 * 회원정보 수정(`/mypage/account`) 전체 흐름 — 로그인 → 비밀번호 재확인 게이트 →
 * 내 정보 수정 → 배송지 추가·삭제. 보호 라우트+게이트+CRUD가 겹치는 흐름이라
 * §6 예비 목록 밖이지만(docs/testing.md) 추가할 가치가 있다고 판단했다(design.md §6).
 *
 * 주소검색(`react-daum-postcode`)은 실제 카카오 우편번호 서비스 스크립트를 로드하므로,
 * `addInitScript`로 `window.kakao.Postcode`를 미리 정의하고 실제 스크립트 태그의
 * `onload`를 즉시 흉내내 대체한다 — `open()` 호출 시 바로 `oncomplete`가 실행된다.
 * **`page.route()`는 쓰지 않는다** — MSW(Service Worker)가 `/api/*`를 가로채는 이
 * 프로젝트에서 `page.route()`를 하나라도 등록하면 Playwright의 네트워크 인터셉션 모드가
 * 바뀌어 MSW의 Service Worker 가로채기까지 깨진다(직접 재현 확인 — 로그인 자체가
 * 실패하며 `/login`에 머문다). 순수 페이지-스크립트 레벨 스텁만 사용해 이 충돌을 피한다.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.kakao = w.kakao ?? {};
    w.kakao.Postcode = function (options: {
      oncomplete: (address: unknown) => void;
    }) {
      const self = this as { open: () => void; embed: () => void };
      self.open = () => {
        options.oncomplete({
          zonecode: "12345",
          roadAddress: "서울특별시 종로구 세종대로 1",
        });
      };
      self.embed = () => {};
    };
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function <T extends Node>(node: T): T {
      if (
        node instanceof HTMLScriptElement &&
        node.id === "kakao_postcode_script"
      ) {
        setTimeout(() => node.onload?.(new Event("load")), 0);
        return node;
      }
      return originalAppendChild.call(this, node) as T;
    };
  });
});

test("로그인 → 회원정보 수정 게이트 통과 → 이름 수정 → 배송지 추가·삭제", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByPlaceholder("이메일을 입력해주세요.").fill("user@midam.test");
  await page.getByPlaceholder("비밀번호를 입력해주세요.").fill("midam1234");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/mypage/account");

  // 비밀번호 재확인 게이트
  await page.getByPlaceholder("비밀번호").fill("midam1234");
  await page.getByRole("button", { name: "확인" }).click();
  await expect(page.getByRole("heading", { name: "내 정보" })).toBeVisible();

  // 내 정보 수정
  await page.getByRole("button", { name: "회원 정보 수정" }).click();
  const nameInput = page.getByRole("textbox", { name: "이름" });
  await nameInput.fill("이수정");
  await page.getByRole("button", { name: "수정 완료하기" }).click();
  await expect(page.getByText("이수정")).toBeVisible();

  // 배송지 탭 → 추가
  await page.getByRole("tab", { name: "배송지" }).click();
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.getByPlaceholder("홍길동").fill("새배송지");
  const phoneInputs = page.getByPlaceholder("0000");
  await phoneInputs.nth(0).fill("5555");
  await phoneInputs.nth(1).fill("6666");
  await page.getByRole("button", { name: "주소검색" }).click();
  await page.getByPlaceholder("상세주소").fill("101동 101호");
  await page.getByRole("button", { name: "추가", exact: true }).click();

  await expect(page.getByText("서울특별시 종로구 세종대로 1")).toBeVisible();

  // 방금 추가한 배송지 삭제 — 기본 배송지가 아닌 카드의 삭제 버튼을 누른다.
  const newCard = page
    .locator('[data-slot="address-card"]')
    .filter({ hasText: "서울특별시 종로구 세종대로 1" });
  await newCard.getByRole("button", { name: "배송지 삭제하기" }).click();

  await expect(
    page.getByText("서울특별시 종로구 세종대로 1"),
  ).not.toBeVisible();
});
