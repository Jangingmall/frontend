import { useMemo } from "react";
import type { Ref } from "react";

/**
 * 여러 ref(콜백 ref / ref 객체)를 하나의 콜백 ref 로 합친다. 컴포넌트가 내부 ref 와
 * 소비자가 넘긴 ref 를 같은 노드에 함께 연결해야 할 때 사용한다.
 */
export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref != null) {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}

/**
 * `mergeRefs` 의 훅 버전. 입력 ref 가 그대로면 같은 콜백을 반환해, 매 렌더마다 ref 가
 * detach/attach(null → node) 되는 것을 막는다.
 */
export function useMergeRefs<T>(
  refA: Ref<T> | undefined,
  refB: Ref<T> | undefined,
): (node: T | null) => void {
  return useMemo(() => mergeRefs(refA, refB), [refA, refB]);
}
