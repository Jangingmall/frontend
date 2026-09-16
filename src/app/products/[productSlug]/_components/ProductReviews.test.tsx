import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { reviewHandlers } from "@/api/reviews/mock/handlers";
import { server } from "@/mocks/server";

import { ProductReviews } from "./ProductReviews";

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  function subscribe(listener: () => void) {
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }
  return {
    useSearchParams: () =>
      new URLSearchParams(
        useSyncExternalStore(subscribe, () => window.location.search),
      ),
    usePathname: () => "/products/test-101",
  };
});
describe("상품 후기 화면", () => {
  beforeEach(() => {
    server.use(...reviewHandlers);
    window.history.replaceState(null, "", "/products/test-101");
    const pushState = window.history.pushState.bind(window.history);
    vi.spyOn(window.history, "pushState").mockImplementation((...args) => {
      pushState(...args);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  });
  function mount(productId = 101) {
    return render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ProductReviews
          productId={productId}
          isMock
          onNotify={vi.fn()}
          onRequireLogin={vi.fn()}
        />
      </QueryClientProvider>,
    );
  }
  it("다섯 후기와 사진 필터, 다음 페이지를 표시한다", async () => {
    mount();
    await screen.findByText("후기 (12)");
    expect(screen.getAllByRole("article")).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "2 페이지" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "2 페이지" })).toHaveAttribute(
        "aria-current",
        "page",
      ),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "사진 후기만 보기" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "1 페이지" })).toHaveAttribute(
        "aria-current",
        "page",
      ),
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /후기 사진 1 크게 보기/ }),
      ).toHaveLength(5),
    );
  });
  it("0개 후기를 명확히 표시한다", async () => {
    mount(102);
    expect(
      await screen.findByText("등록된 후기가 없습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("후기 (0)")).toBeInTheDocument();
    expect(screen.getByText("평점 없음")).toBeInTheDocument();
  });
  it("필터·페이지·정렬 변경 후 조작한 컨트롤의 포커스를 유지하고 기록 이동을 반영한다", async () => {
    mount();
    await screen.findByText("후기 (12)");
    const user = userEvent.setup();
    const checkbox = screen.getByRole("checkbox", { name: "사진 후기만 보기" });
    await user.click(checkbox);
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /후기 사진 1 크게 보기/ }),
      ).toHaveLength(5),
    );
    expect(checkbox).toHaveFocus();
    expect(screen.getByRole("checkbox", { name: "사진 후기만 보기" })).toBe(
      checkbox,
    );
    const page = screen.getByRole("button", { name: "2 페이지" });
    await user.click(page);
    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
    expect(page).toHaveFocus();
    const sort = screen.getByRole("combobox", { name: "후기 정렬" });
    await user.click(sort);
    await user.click(
      await screen.findByRole("option", { name: "별점 높은 순" }),
    );
    await waitFor(() => expect(sort).toHaveFocus());
    expect(screen.getByRole("combobox", { name: "후기 정렬" })).toBe(sort);
    expect(new URLSearchParams(window.location.search).get("reviewSort")).toBe(
      "high",
    );
    act(() => {
      window.history.replaceState(
        null,
        "",
        "/products/test-101?reviewPage=2&reviewSort=latest&photoOnly=false",
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "2 페이지" })).toHaveAttribute(
        "aria-current",
        "page",
      ),
    );
    expect(checkbox).not.toBeChecked();
    expect(sort).toHaveTextContent("최신순");
  });
});
