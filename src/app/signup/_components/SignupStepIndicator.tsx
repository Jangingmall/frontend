import { ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * "01 회원가입 › 02 회원 정보 입력 › 03 회원가입 완료" 스텝 인디케이터. `/signup`(01/02)과
 * `/signup/complete`(03) 세 화면이 공유한다(design.md §1).
 */
const STEPS = ["회원가입", "회원 정보 입력", "회원가입 완료"] as const;

interface SignupStepIndicatorProps {
  current: 1 | 2 | 3;
}

export function SignupStepIndicator({ current }: SignupStepIndicatorProps) {
  return (
    <ol className="flex items-center gap-2 text-body-s text-font-dark-subtle">
      {STEPS.map((label, index) => {
        const step = index + 1;
        return (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRightIcon className="size-4" aria-hidden="true" />
            )}
            <span
              className={cn(step === current && "text-body-s-b text-font-dark")}
            >
              {String(step).padStart(2, "0")} {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
