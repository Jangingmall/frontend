import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

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
  /** 주어지면 `next/link`로 이동, 없으면 정적 `<button>`(예: 아직 안 붙은 검색 토글). */
  href?: Route;
}

function HeaderIconButton({ label, children, href }: HeaderIconButtonProps) {
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
    <button type="button" aria-label={label} className={className}>
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
}

function Header({
  logo = LOGO_PLACEHOLDER,
  authStatus = "anonymous",
  cartCount = 0,
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
        <HeaderIconButton label="검색">
          <SearchIcon className="size-6" />
        </HeaderIconButton>
        <Cart href={"/cart" as Route} count={cartCount} />
      </div>
    </header>
  );
}

export { Header };
export type { HeaderProps };
