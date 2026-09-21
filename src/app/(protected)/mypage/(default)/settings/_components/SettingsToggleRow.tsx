import type { ReactNode } from "react";

import { Toggle } from "@/components/ui/toggle";

/**
 * 설정 화면 공용 행 — Toggle + 라벨(+선택적 trailing). Figma MY-7 Settings Container의
 * 행 4개(다크모드·주문 알림·찜 알림·마케팅 수신동의)가 전부 같은 모양이라 공용 컴포넌트로
 * 둔다.
 */
interface SettingsToggleRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** 마케팅 수신동의 행처럼 우측에 보조 텍스트가 필요할 때만 넘긴다. */
  trailing?: ReactNode;
}

function SettingsToggleRow({
  label,
  checked,
  onCheckedChange,
  disabled,
  trailing,
}: SettingsToggleRowProps) {
  return (
    <div className="flex w-full items-center gap-3 p-3">
      <Toggle
        size="s"
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next)}
        disabled={disabled}
      />
      <span className="text-body-m text-font-dark">{label}</span>
      {trailing != null && (
        <span className="flex-1 text-right text-body-m text-font-dark-subtle">
          {trailing}
        </span>
      )}
    </div>
  );
}

export { SettingsToggleRow };
export type { SettingsToggleRowProps };
