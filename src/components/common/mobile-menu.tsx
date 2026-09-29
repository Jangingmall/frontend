"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CancelIcon,
  ChevronRightIcon,
  MenuIcon,
} from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import type { GnbCategory } from "@/lib/gnb-categories";
import { cn } from "@/lib/utils";

import { ErrorState } from "./error-state";
import { GNB_NAV_ITEMS } from "./gnb-nav";

type MobileMenuView = "root" | "category";
type MobileMenuAuthStatus = "loading" | "anonymous" | "authenticated";
type MobileMenuCategoriesStatus = "ready" | "loading" | "error";

/**
 * 모바일(`md` 미만) 전체화면 메뉴 — Figma `HO-menu-1`(전체 메뉴) · `HO-menu-2`(대분류 → 소분류).
 * 순수 프레젠테이션이라 `api`·`queries`·`stores`를 참조하지 않는다(`docs/architecture.md` §8.2):
 * 인증 상태는 문자열, 분류는 `Gnb`가 넘겨준 트리를 받는다.
 *
 * 모달의 스크롤 잠금·포커스 트랩·ESC 닫기·`aria-modal`은 `@base-ui/react/dialog`가 맡는다.
 * 어느 화면을 보여줄지(`view`)와 열림 여부는 `Gnb`가 소유한다 — 열린 채로 `md` 이상으로 넓어지면
 * `Gnb`가 닫는다(이 컴포넌트는 CSS로만 숨겨선 스크롤 잠금이 남기 때문에 상태를 정리해야 한다).
 *
 * 이동 링크를 누르면 라우트가 바뀌므로 메뉴를 닫는다(`onOpenChange(false)`). 「전체 카테고리」는
 * 링크가 아니라 대분류 화면으로 들어가는 버튼이다.
 *
 * 인터랙션은 GUI 파일 반응형 페이지의 주석(HO-menu-1/2)을 따른다: 종료 버튼 = 메뉴 닫기,
 * 로그인 상태 False = "로그인 / 회원가입"(→ 로그인), True = 사용자 이름(→ 마이페이지) + 로그아웃
 * 버튼, 전체 카테고리 = HO-menu-2로, 뒤로가기 = HO-menu-1로, **대분류 = PL-2로 이동**(소분류는
 * 목록 화면의 몫이라 여기서 펼치지 않는다).
 */
interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: MobileMenuView;
  onViewChange: (view: MobileMenuView) => void;
  authStatus?: MobileMenuAuthStatus;
  /** 로그인 상태에서 최상단에 보여줄 사용자 이름(누르면 마이페이지). */
  userName?: string;
  /** 로그아웃 버튼 핸들러. 세션 정리는 호출부(`app/site-gnb.tsx`)가 한다. */
  onLogout?: () => void;
  categories?: GnbCategory[];
  categoriesStatus?: MobileMenuCategoriesStatus;
  onCategoriesRetry?: () => void;
  logo?: ReactNode;
}

const ROW_CLASS =
  "flex w-full items-center justify-between border-b border-border-neutral-subtle px-2 py-4 text-left text-body-l font-medium text-font-dark outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-jade-fill";

function productsHref(categoryId: string): Route {
  return `/products?category=${encodeURIComponent(categoryId)}` as Route;
}

function AuthRow({
  status,
  userName,
  onLogout,
  onNavigate,
}: {
  status: MobileMenuAuthStatus;
  userName?: string;
  onLogout?: () => void;
  onNavigate: () => void;
}) {
  // 로그아웃은 메뉴를 먼저 닫고 실행한다 — 세션이 비워지면 보호 경로의 가드가 로그인 화면으로
  // 이동시키는데, 메뉴가 열린 채면 전체화면 메뉴가 그 화면을 덮는다.
  function handleLogout() {
    onNavigate();
    onLogout?.();
  }

  if (status === "loading") {
    return <Skeleton className="mx-2 my-3 h-6 w-40" />;
  }
  if (status === "authenticated") {
    return (
      <div className="flex items-center justify-between gap-3">
        <Link
          href={"/mypage" as Route}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 px-2 py-3 text-title-m text-font-dark outline-none focus-visible:outline-2 focus-visible:outline-border-jade-fill [&_path]:fill-current"
        >
          <span className="truncate">{userName ?? "마이페이지"}</span>
          <ArrowRightIcon className="size-6 shrink-0" />
        </Link>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleLogout}
          className="shrink-0"
        >
          로그아웃
        </Button>
      </div>
    );
  }
  return (
    <Link
      href={"/login" as Route}
      onClick={onNavigate}
      className="flex items-center gap-2 px-2 py-3 text-title-m text-font-dark outline-none focus-visible:outline-2 focus-visible:outline-border-jade-fill [&_path]:fill-current"
    >
      로그인 / 회원가입
      <ArrowRightIcon className="size-6" />
    </Link>
  );
}

function MobileMenu({
  open,
  onOpenChange,
  view,
  onViewChange,
  authStatus = "anonymous",
  userName,
  onLogout,
  categories = [],
  categoriesStatus = "ready",
  onCategoriesRetry,
  logo = <Logo className="h-8 w-auto text-font-dark" />,
}: MobileMenuProps) {
  const close = () => onOpenChange(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          data-slot="mobile-menu"
          className="fixed inset-0 z-60 flex flex-col overflow-y-auto bg-bg-default text-font-dark outline-none md:hidden"
        >
          <DialogPrimitive.Title className="sr-only">
            전체 메뉴
          </DialogPrimitive.Title>
          <div className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center page-gutter">
            <MenuIcon
              aria-hidden="true"
              className="size-6 justify-self-start [&_path]:fill-current"
            />
            <div aria-hidden="true">{logo}</div>
            <DialogPrimitive.Close
              aria-label="메뉴 닫기"
              className="flex size-8 items-center justify-center justify-self-end rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-border-jade-fill [&_path]:fill-current"
            >
              <CancelIcon className="size-6" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-col gap-6 page-gutter pt-4 pb-12">
            <AuthRow
              status={authStatus}
              userName={userName}
              onLogout={onLogout}
              onNavigate={close}
            />

            {view === "root" ? (
              <nav aria-label="전체 메뉴" className="flex flex-col">
                {/* 「전체 카테고리」는 GNB_NAV_ITEMS에 없다 — 항상 첫 줄이고 대분류 화면으로 들어간다. */}
                <button
                  type="button"
                  onClick={() => onViewChange("category")}
                  className={ROW_CLASS}
                >
                  전체 카테고리
                </button>
                {GNB_NAV_ITEMS.map((item) =>
                  item.disabled || !item.href ? (
                    <span
                      key={item.label}
                      aria-disabled="true"
                      className={ROW_CLASS}
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={close}
                      className={ROW_CLASS}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </nav>
            ) : (
              <nav aria-label="분류" className="flex flex-col">
                <button
                  type="button"
                  onClick={() => onViewChange("root")}
                  className={cn(ROW_CLASS, "justify-start gap-2")}
                >
                  <ArrowLeftIcon
                    aria-hidden="true"
                    className="size-5 [&_path]:fill-current"
                  />
                  뒤로가기
                </button>
                {categories.length === 0 ? (
                  categoriesStatus === "error" ? (
                    <ErrorState
                      title="분류를 불러오지 못했습니다"
                      description="잠시 후 다시 시도해 주세요."
                      onRetry={onCategoriesRetry}
                      className="py-8"
                    />
                  ) : (
                    <div
                      role="status"
                      aria-label="분류를 불러오는 중"
                      className="flex flex-col gap-3 pt-4"
                    >
                      {Array.from({ length: 7 }, (_, index) => (
                        <Skeleton key={index} className="h-6 w-full" />
                      ))}
                    </div>
                  )
                ) : (
                  categories.map((category) => (
                    <Link
                      key={category.id}
                      href={productsHref(category.id)}
                      onClick={close}
                      className={ROW_CLASS}
                    >
                      {category.name}
                      <ChevronRightIcon
                        aria-hidden="true"
                        className="size-6 [&_path]:fill-current"
                      />
                    </Link>
                  ))
                )}
              </nav>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MobileMenu };
export type {
  MobileMenuAuthStatus,
  MobileMenuCategoriesStatus,
  MobileMenuProps,
  MobileMenuView,
};
