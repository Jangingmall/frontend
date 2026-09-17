/**
 * 비밀번호 안전도 판정. 회원가입(`SignupInfoForm`)·비밀번호 변경(`PasswordChangeTab`)이
 * 공유한다 — 두 번째 사용처가 생겨 로컬 함수를 여기로 승격했다(docs/architecture.md
 * "공유 조각은 2번째 사용 시 승격" 원칙).
 *
 * `state`는 `components/ui/progress-bar`의 `ProgressState`와 같은 문자열 리터럴 집합이다
 * — `constants/`는 하위 공통 코드만 참조할 수 있어(architecture.md §8.2) 그 타입을 직접
 * import하지 않고 구조적으로 동일한 유니온을 그대로 반복한다.
 */
const PASSWORD_SPECIAL_CHARS = "!@#$%";

export function countPasswordClasses(value: string): number {
  let count = 0;
  if (/[A-Z]/.test(value)) count += 1;
  if (/[a-z]/.test(value)) count += 1;
  if (/\d/.test(value)) count += 1;
  if (new RegExp(`[${PASSWORD_SPECIAL_CHARS}]`).test(value)) count += 1;
  return count;
}

export function passwordStrengthState(password: string): {
  state: "default" | "alert" | "caution" | "good" | "perfect";
  label: string;
} {
  if (password.length === 0) return { state: "default", label: "" };
  const classes = countPasswordClasses(password);
  if (password.length < 8 || classes <= 1) {
    return { state: "alert", label: "매우낮음" };
  }
  if (classes === 2) return { state: "caution", label: "낮음" };
  if (classes === 3) return { state: "good", label: "보통" };
  return { state: "perfect", label: "높음" };
}
