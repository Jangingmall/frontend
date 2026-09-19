import type { ReactNode } from "react";

/**
 * 회원정보 수정 폼 공통 행 — 라벨(90px, 좌측, 굵게) + 입력(나머지 폭). `InputField`의
 * 기본 라벨은 입력창 위에 뜨지만, 이 화면 계열(ID-1-edit)은 라벨이 입력창 왼쪽에 나란히
 * 있다(2026-09-17 `get_design_context` 대조로 확인) — 그래서 `InputField`엔 `label`을
 * 안 주고 이 wrapper가 라벨을 대신 그린다. `ProfileEditForm`·`PasswordChangeTab`이
 * 공유한다 — 두 번째 사용처가 생겨 로컬 마크업을 컴포넌트로 승격했다(architecture.md
 * "공유 조각은 2번째 사용 시 승격" 원칙). `SignupInfoForm`의 동일 이름 컴포넌트와는
 * 별개다 — 그 화면은 gap 수치가 달라(16px) 억지로 합치지 않는다.
 */
interface FieldRowProps {
  label: ReactNode;
  required?: boolean;
  children: ReactNode;
}

function FieldRow({ label, required = false, children }: FieldRowProps) {
  return (
    <div className="flex items-start gap-6">
      <span className="flex w-[5.625rem] shrink-0 items-center gap-0.5 py-2 text-body-s-b text-font-dark">
        {label}
        {required && <span className="font-normal text-red-font">*</span>}
      </span>
      <div className="flex flex-1 flex-col gap-1">{children}</div>
    </div>
  );
}

export { FieldRow };
export type { FieldRowProps };
