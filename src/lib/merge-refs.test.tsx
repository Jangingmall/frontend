import { render } from "@testing-library/react";
import type { Ref } from "react";
import { createRef, useRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { mergeRefs, useMergeRefs } from "./merge-refs";

describe("mergeRefs", () => {
  it("객체 ref 와 콜백 ref 모두에 노드를 반영한다", () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    const node = document.createElement("div");

    mergeRefs<HTMLDivElement>(objectRef, callbackRef)(node);

    expect(objectRef.current).toBe(node);
    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it("cleanup 을 반환하지 않는 ref 는 정리 시 null 로 되돌린다", () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    const node = document.createElement("div");

    const cleanup = mergeRefs<HTMLDivElement>(objectRef, callbackRef)(node);
    callbackRef.mockClear();
    cleanup();

    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenCalledWith(null);
  });

  it("콜백 ref 가 반환한 cleanup 을 보존해 정리 시 실행한다", () => {
    const refCleanup = vi.fn();
    const callbackRef = vi.fn(() => refCleanup);
    const node = document.createElement("div");

    const cleanup = mergeRefs<HTMLDivElement>(callbackRef)(node);
    callbackRef.mockClear();
    cleanup();

    expect(refCleanup).toHaveBeenCalledTimes(1);
    // cleanup 을 반환한 ref 는 null 로 다시 호출하지 않는다.
    expect(callbackRef).not.toHaveBeenCalled();
  });
});

describe("useMergeRefs (React 19 통합)", () => {
  const seen: { inner: HTMLInputElement | null } = { inner: null };

  function Probe({ outerRef }: { outerRef: Ref<HTMLInputElement> }) {
    const innerRef = useRef<HTMLInputElement>(null);
    const merged = useMergeRefs(innerRef, outerRef);
    return (
      <input
        ref={(node) => {
          const cleanup = merged(node);
          seen.inner = innerRef.current;
          return cleanup;
        }}
      />
    );
  }

  it("마운트 시 내부·외부 ref 가 같은 노드를 가리키고 언마운트 시 비워진다", () => {
    const outerRef = createRef<HTMLInputElement>();

    const view = render(<Probe outerRef={outerRef} />);

    expect(outerRef.current).toBeInstanceOf(HTMLInputElement);
    expect(seen.inner).toBe(outerRef.current);

    view.unmount();
    expect(outerRef.current).toBeNull();
  });
});
