import { describe, expect, it } from "vitest";

import { pickRandomSample } from "./random";

describe("pickRandomSample", () => {
  it("요청한 개수만큼 뽑는다", () => {
    const result = pickRandomSample([1, 2, 3, 4, 5], 3, () => 0);
    expect(result).toHaveLength(3);
  });

  it("중복 없이 뽑는다", () => {
    const result = pickRandomSample([1, 2, 3, 4, 5], 5, () => 0.5);
    expect(new Set(result).size).toBe(5);
  });

  it("count가 배열 길이 이상이면 전체를 반환한다", () => {
    const result = pickRandomSample([1, 2, 3], 10, () => 0);
    expect(result).toHaveLength(3);
    expect(new Set(result)).toEqual(new Set([1, 2, 3]));
  });

  it("random()이 항상 0이면 원래 순서 그대로 뽑는다(경계값)", () => {
    const result = pickRandomSample([1, 2, 3, 4], 4, () => 0);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it("random()이 항상 0.999...에 가까우면 매번 마지막 원소와 교환한다", () => {
    const result = pickRandomSample([1, 2, 3, 4], 4, () => 0.9999);
    expect(result).toEqual([4, 1, 2, 3]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const items = [1, 2, 3, 4, 5];
    pickRandomSample(items, 3, () => 0.5);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });
});
