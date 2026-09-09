import type { ComponentProps, ReactNode } from "react";

import { ProfileIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import { Cart } from "./cart";

/**
 * Figma `[FE] Components / Navigation-bar` 의 `header` set (1440×70, `--fill-neutral-impact`
 * 배경). 사이트 상단 바 — `[로고][우측 아이콘 + Cart]`. Figma 의 좌측 utility 프레임은
 * `opacity: 0` 인 죽은 placeholder 라 렌더하지 않고, 로고를 중앙에 두기 위한 3분할 레이아웃만
 * 남긴다. `cart-num` variant 는 `cartCount` 로 대체.
 * 로고·아이콘은 아직 미확정 — 로고는 placeholder 박스, 우측은 프로필·검색 기본값.
 * 반응형은 미정 — desktop(1440) 기준.
 */
const LOGO_PLACEHOLDER = (
  <span className="inline-flex h-8 items-center bg-(--jade-blue-400) px-2 text-title-l text-font-dark-subtle">
    로고
  </span>
);

interface HeaderIconButtonProps {
  label: string;
  children: ReactNode;
}

function HeaderIconButton({ label, children }: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-8 shrink-0 items-center justify-center text-font-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill [&_path]:fill-current"
    >
      {children}
    </button>
  );
}

interface HeaderProps extends ComponentProps<"header"> {
  logo?: ReactNode;
  /** 로고 오른쪽 아이콘 영역 (기본: 프로필·검색). Cart 는 항상 맨 뒤에 붙는다. */
  endActions?: ReactNode;
  cartCount?: number;
}

function Header({
  logo = LOGO_PLACEHOLDER,
  endActions,
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
        {endActions ?? (
          <>
            <HeaderIconButton label="내 정보">
              <ProfileIcon className="size-6" />
            </HeaderIconButton>
            <HeaderIconButton label="검색">
              <SearchIcon className="size-6" />
            </HeaderIconButton>
          </>
        )}
        <Cart count={cartCount} />
      </div>
    </header>
  );
}

export { Header };
export type { HeaderProps };
