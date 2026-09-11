import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 정상 응답이지만 표시할 데이터가 없는 상태 안내. (docs/ui-system.md §7.3)
 *
 * 로딩(`Skeleton`)·오류(`ErrorState`)·404·권한 부족과 구분되는 "정상인데 데이터 0" 전용이다.
 * 노출 조건·구체적 안내 문구·다음 행동은 호출 화면 책임이라 여기선 슬롯만 제공한다 — 데이터는
 * 전부 props로만 받는 순수 프레젠테이션.
 */
interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  /** 예: "찜한 상품이 없어요" */
  title: ReactNode;
  /** 보조 안내 */
  description?: ReactNode;
  /** 선택 일러스트/아이콘 슬롯 */
  icon?: ReactNode;
  /** 선택 CTA (예: 쇼핑 계속하기 버튼) */
  action?: ReactNode;
}

function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-16 text-center",
        className,
      )}
      {...props}
    >
      {icon}
      <p className="text-title-s text-font-dark">{title}</p>
      {description != null && (
        <p className="text-body-s text-font-dark-weak">{description}</p>
      )}
      {action}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
