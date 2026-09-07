import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / button` set 을 `variant` × `size` 직교 구조로 재구성했다.
 * Figma 의 `name`(xl-black/xl-jade/l-black/.../option/footer/icon) 은 크기·색·아이콘을 한
 * 축에 섞어 놓았어서 그대로 옮기지 않는다. 매핑:
 *   - option → `variant="outline" size="xs"`
 *   - footer → `variant="ghost" size="xs"` (compound 로 px-0 / 13px / 흐린 글자 처리)
 *   - icon   → 아이콘을 children 으로 넣으면 됨(별도 size 아님)
 *
 * hover/pressed 는 Figma "Stateslayer"(반투명 오버레이)를 `background-image` 위에 겹치는
 * linear-gradient 로 구현한다(가상요소 z-index 문제 회피). 색 계층은 foundation 의
 * `--states-hover`(jade-blue-400 50%) / `--states-hover-25`(25%) 를 그대로 쓴다.
 *
 * Figma 내부 불일치는 사용자 결정에 따라 정규화하지 않고 유지한다:
 *   - jade 배경이 xl 은 `--button-jade-weak`(#FAFBFC), 그 외는 `--button-jade`(#C8D9DC)
 *   - disabled opacity 가 jade+xl 만 0.5, 나머지는 0.6
 * 단 Figma 의 `m`/`s` variant 는 default 가 투명 배경+흰 글자, pressed 에서 배경색이 뒤집히는
 * 등 값이 깨져 있어 그 부분만 표준 오버레이 동작으로 정규화했다(progress.md 에 기록, 디자이너
 * 확인 필요).
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xs border border-transparent bg-clip-padding whitespace-nowrap transition-[background-image,border-color,color,opacity] outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill disabled:pointer-events-none disabled:opacity-60 data-loading:pointer-events-none data-loading:cursor-default [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        solid:
          "bg-(--button-black) text-font-white hover:[background-image:linear-gradient(var(--states-hover-25),var(--states-hover-25))] active:[background-image:linear-gradient(var(--states-hover-25),var(--states-hover-25))]",
        jade: "bg-(--button-jade) text-font-dark hover:[background-image:linear-gradient(var(--states-hover),var(--states-hover))] active:[background-image:linear-gradient(var(--states-hover),var(--states-hover))]",
        outline:
          "border-(--button-border-black) text-font-dark hover:[background-image:linear-gradient(var(--states-hover),var(--states-hover))] active:border-border-jade-fill active:[background-image:linear-gradient(var(--states-hover),var(--states-hover))]",
        ghost:
          "text-font-dark hover:[background-image:linear-gradient(var(--states-hover),var(--states-hover))] active:[background-image:linear-gradient(var(--states-hover),var(--states-hover))]",
      },
      size: {
        xl: "h-14 gap-2 px-6 text-button-xl",
        l: "h-[54px] gap-2 px-6 text-button-l",
        m: "h-13 gap-2 px-6 text-body-m",
        s: "h-11 gap-1.5 px-6 text-body-m",
        xs: "h-7 gap-1 px-3 text-body-m [&_svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [
      // Figma: xl 의 jade 만 더 옅은 배경(#FAFBFC). 나머지 jade 는 #C8D9DC (불일치 유지)
      { variant: "jade", size: "xl", class: "bg-(--button-jade-weak)" },
      // Figma: jade + xl 의 disabled 만 opacity 0.5 (그 외 0.6)
      { variant: "jade", size: "xl", class: "disabled:opacity-50" },
      // Figma `footer` = ghost + xs: 좌우 패딩 없음, 13px, 흐린 글자
      {
        variant: "ghost",
        size: "xs",
        class: "gap-1 px-0 text-body-s text-font-dark-subtle",
      },
    ],
    defaultVariants: { variant: "solid", size: "l" },
  },
);

interface ButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  /**
   * 로딩 표시. 라벨/아이콘 자리에 점 3개 인디케이터를 보여주고 클릭을 막는다.
   * Figma loading variant 는 흐려지지 않으므로 `disabled` 와 달리 opacity 를 유지한다.
   */
  loading?: boolean;
}

function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <LoadingDots>{children}</LoadingDots> : children}
    </ButtonPrimitive>
  );
}

function LoadingDots({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="inline-flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="size-2 animate-pulse rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="size-2 animate-pulse rounded-full bg-current" />
      </span>
    </>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
