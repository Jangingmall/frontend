export type AccountTab = "info" | "password" | "addresses" | "payment-methods";

const VALID_TABS: readonly AccountTab[] = [
  "info",
  "password",
  "addresses",
  "payment-methods",
];

/** URL의 `tab` 값을 알려진 값으로 정규화한다. 알 수 없는 값·누락은 `info`로 떨어진다. */
export function normalizeAccountTab(
  value: string | string[] | null | undefined,
): AccountTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VALID_TABS.includes(candidate as AccountTab)
    ? (candidate as AccountTab)
    : "info";
}
