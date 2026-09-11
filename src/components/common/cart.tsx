import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";

import { CartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / Navigation-bar` 의 `Cart` set (32×32). 상단 네비게이션의 장바구니
 * 버튼 — 흰색 장바구니 아이콘 + 담긴 개수 뱃지.
 *   - Figma `amount` = true/false 는 뱃지 on/off variant. 코드에선 `count: number` 로 받아
 *     `count > 0` 일 때만 뱃지, 100 이상은 `99+` 로 캡
 *   - 뱃지: `--jade-blue-400`(#D3E1E3, Figma `cart-number` raw — 대응 semantic 토큰 없음) 원 +
 *     `text-caption-b`(10/600) `--font-dark`
 *   - `CartIcon` 자산은 fill 이 `#121B29` 로 하드코딩돼 있어 `[&_path]:fill-current` 로
 *     덮어써서 어두운 nav 위 흰색으로 만든다
 *   - `href` 가 주어지면 IA CM-1(장바구니 진입: CA-1로 이동)대로 `next/link`로 렌더한다.
 *     없으면 기존처럼 `<button>`(단독 렌더·Storybook 호환).
 */
interface CartProps extends ComponentProps<"button"> {
  /** 장바구니에 담긴 개수. 0 이하면 뱃지를 숨긴다. */
  count?: number;
  /** 주어지면 `<button>` 대신 이 경로로 이동하는 `<Link>`로 렌더한다. */
  href?: Route;
}

function Cart({ count = 0, href, className, ...props }: CartProps) {
  const showBadge = count > 0;
  const label = count > 99 ? "99+" : String(count);
  const ariaLabel = showBadge ? `장바구니 (${count}개)` : "장바구니";

  const badge = showBadge && (
    <span
      aria-hidden="true"
      className="absolute -right-1 -bottom-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-(--jade-blue-400) px-1 text-caption-b text-font-dark"
    >
      {label}
    </span>
  );

  const rootClassName = cn(
    "relative inline-flex size-8 shrink-0 items-center justify-center text-font-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill [&_path]:fill-current",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        data-slot="cart"
        aria-label={ariaLabel}
        className={rootClassName}
      >
        <CartIcon className="size-6" />
        {badge}
      </Link>
    );
  }

  return (
    <button
      type="button"
      data-slot="cart"
      aria-label={ariaLabel}
      className={rootClassName}
      {...props}
    >
      <CartIcon className="size-6" />
      {badge}
    </button>
  );
}

export { Cart };
export type { CartProps };
