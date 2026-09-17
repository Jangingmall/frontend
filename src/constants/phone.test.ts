import { describe, expect, it } from "vitest";

import { PHONE_PREFIXES } from "./phone";

describe("PHONE_PREFIXES", () => {
  it("010을 포함한 6개의 통신사 접두사를 담는다", () => {
    expect(PHONE_PREFIXES).toEqual(["010", "011", "016", "017", "018", "019"]);
  });
});
