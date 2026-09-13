import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode, Ref } from "react";

import { ProfileIcon, SearchIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { Cart } from "./cart";

/**
 * Figma `[FE] Components / Navigation-bar` 의 `header` set (1440×70, `--fill-neutral-impact`
 * 배경) + IA CM-1 인증 영역. 사이트 상단 바 — `[로고][사람 아이콘][검색 아이콘][Cart]`.
 * Figma 의 좌측 utility 프레임은 `opacity: 0` 인 죽은 placeholder 라 렌더하지 않고, 로고를
 * 중앙에 두기 위한 3분할 레이아웃만 남긴다.
 * 로고는 아직 미확정 — placeholder 박스.
 * 반응형은 미정 — desktop(1440) 기준.
 */
const LOGO_PLACEHOLDER = (
  <span className="inline-flex h-8 items-center bg-(--jade-blue-400) px-2 text-title-l text-font-dark-subtle">
    로고
  </span>
);

type AuthAreaStatus = "loading" | "anonymous" | "authenticated";

interface HeaderIconButtonProps {
  label: string;
  children: ReactNode;
  /** 주어지면 `next/link`로 이동, 없으면 `<button>`(예: 검색 토글 — `onClick`으로 동작 연결). */
  href?: Route;
  /** `href` 없는 버튼 전용 — 검색 토글처럼 클릭 핸들러가 필요한 경우. */
  onClick?: () => void;
  ref?: Ref<HTMLButtonElement>;
  "aria-expanded"?: boolean;
}

function HeaderIconButton({
  label,
  children,
  href,
  onClick,
  ref,
  "aria-expanded": ariaExpanded,
}: HeaderIconButtonProps) {
  const className =
    "inline-flex size-8 shrink-0 items-center justify-center text-font-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill [&_path]:fill-current";

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

/**
 * 인증 상태별 사람 아이콘 영역. (docs/routing-and-auth.md §4.2)
 * `loading`: 부팅 silent refresh 확정 전 스켈레톤. `anonymous`: 로그인 링크.
 * `authenticated`: 마이페이지 링크. 로그아웃·판매자 전환 하위 메뉴는 Figma에 아직 디자인이
 * 없어 범위 밖 — `api/member/api.ts`의 `logout()`은 이미 있어 후속 작업에서 바로 연결 가능.
 */
interface AuthAreaProps {
  status: AuthAreaStatus;
}

function AuthArea({ status }: AuthAreaProps) {
  if (status === "loading") {
    return <Skeleton className="size-8 rounded-full" />;
  }

  const authenticated = status === "authenticated";
  return (
    <HeaderIconButton
      label={authenticated ? "마이페이지" : "로그인"}
      href={(authenticated ? "/mypage" : "/login") as Route}
    >
      <ProfileIcon className="size-6" />
    </HeaderIconButton>
  );
}

interface HeaderProps extends ComponentProps<"header"> {
  logo?: ReactNode;
  /** 기본값 "anonymous" — 단독 렌더·Storybook에서 항상 뭔가는 보이도록. */
  authStatus?: AuthAreaStatus;
  cartCount?: number;
  /** CM-3 검색 패널 열림 여부. `Gnb`가 소유(§`gnb.tsx`) — 검색 토글의 `aria-expanded`에만 쓴다.
   * 기본값 `false` — 단독 렌더·Storybook에서 검색 기능 없이도 정적 버튼으로 보이게. */
  isSearchPanelOpen?: boolean;
  /** 검색 토글 클릭 핸들러. 안 주면 아무 동작 없는 정적 버튼(하위 호환). */
  onSearchTriggerClick?: () => void;
  searchTriggerRef?: Ref<HTMLButtonElement>;
}

function Header({
  logo = LOGO_PLACEHOLDER,
  authStatus = "anonymous",
  cartCount = 0,
  isSearchPanelOpen = false,
  onSearchTriggerClick,
  searchTriggerRef,
  className,
  ...props
}: HeaderProps) {
  return (
    <header
      data-slot="header"
      className={cn(
        "grid h-17.5 grid-cols-[1fr_auto_1fr] items-center bg-fill-neutral-impact px-12",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" />
      <div className="justify-self-center">{logo}</div>
      <div className="flex items-center gap-3 justify-self-end">
        <AuthArea status={authStatus} />
        <HeaderIconButton
          ref={searchTriggerRef}
          label="검색"
          onClick={onSearchTriggerClick}
          aria-expanded={isSearchPanelOpen}
        >
          <SearchIcon className="size-6" />
        </HeaderIconButton>
        <Cart href={"/cart" as Route} count={cartCount} />
      </div>
    </header>
  );
}

export { Header };
export type { HeaderProps };
