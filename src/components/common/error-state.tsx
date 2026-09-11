import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { resolveErrorMessage } from "@/constants/error-messages";
import { cn } from "@/lib/utils";

/**
 * 예상 가능한 FE·BE 오류 안내. (docs/ui-system.md §7.5)
 *
 * `code`/`status`는 호출부가 `ApiError`에서 꺼내 전달한다 — 이 컴포넌트는 `lib/http`를
 * 직접 참조하지 않는다(docs/architecture.md §8.2 의존성 방향). 필드 단위 입력 오류는
 * Input·Form 인라인 오류의 몫이라 여기서 다루지 않는다.
 */
interface ErrorStateProps extends Omit<ComponentProps<"div">, "title"> {
  /** `ApiError.code` */
  code?: string;
  /** `ApiError.status` */
  status?: number;
  title?: ReactNode;
  /** 없으면 `code`/`status`로 `resolveErrorMessage` 결과를 쓴다 */
  description?: ReactNode;
  icon?: ReactNode;
  /** 있으면 재시도 버튼을 보여준다 */
  onRetry?: () => void;
  retryLabel?: string;
}

function ErrorState({
  code,
  status,
  title = "문제가 발생했어요",
  description,
  icon,
  onRetry,
  retryLabel = "다시 시도",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-16 text-center",
        className,
      )}
      {...props}
    >
      {icon}
      <p className="text-title-s text-font-dark">{title}</p>
      <p className="text-body-s text-font-dark-weak">
        {description ?? resolveErrorMessage(code, status)}
      </p>
      {onRetry && (
        <Button variant="outline" size="s" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
