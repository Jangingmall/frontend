import type { Ref } from "react";
import { useMemo } from "react";

type PossibleRef<T> = Ref<T> | undefined;

/** 단일 ref 에 값을 반영한다. 콜백 ref 면 그 반환값(React 19 cleanup)을 그대로 돌려준다. */
function setRef<T>(ref: PossibleRef<T>, value: T | null): void | (() => void) {
  if (typeof ref === "function") {
    return ref(value) as void | (() => void);
  }
  if (ref != null) {
    (ref as { current: T | null }).current = value;
  }
}

/**
 * 여러 ref(콜백 ref / ref 객체)를 하나의 콜백 ref 로 합친다. 컴포넌트가 내부 ref 와
 * 소비자가 넘긴 ref 를 같은 노드에 함께 연결해야 할 때 사용한다.
 *
 * React 19 콜백 ref 의 cleanup 규약을 지킨다: 각 ref 가 cleanup 을 반환하면 그것을,
 * 아니면 `ref(null)` / `ref.current = null` 로 되돌리는 함수를 모아 두었다가 노드 교체·
 * 언마운트 시 한 번에 실행한다.
 */
export function mergeRefs<T>(
  ...refs: Array<PossibleRef<T>>
): (node: T | null) => () => void {
  return (node) => {
    const cleanups: Array<() => void> = [];

    for (const ref of refs) {
      const cleanup = setRef(ref, node);
      cleanups.push(
        typeof cleanup === "function" ? cleanup : () => setRef(ref, null),
      );
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  };
}

/**
 * `mergeRefs` 의 훅 버전. 입력 ref 가 그대로면 같은 콜백을 반환해, 매 렌더마다 ref 가
 * detach/attach 되는 것을 막는다.
 */
export function useMergeRefs<T>(
  refA: PossibleRef<T>,
  refB: PossibleRef<T>,
): (node: T | null) => () => void {
  return useMemo(() => mergeRefs(refA, refB), [refA, refB]);
}
