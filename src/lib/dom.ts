/**
 * React 가 controlled / uncontrolled 어느 쪽이든 값 변경을 감지하도록, 네이티브 value setter 로
 * `<input>` 값을 바꾸고 `input` 이벤트를 버블링으로 발생시킨다. clear 버튼처럼 컴포넌트가
 * 직접 값을 비울 때 사용한다.
 */
export function setNativeInputValue(
  input: HTMLInputElement,
  value: string,
): void {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
