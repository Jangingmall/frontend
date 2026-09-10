import { describe, expect, it } from "vitest";

import { mapMemberMe } from "./mapper";

describe("mapMemberMe", () => {
  it("DTO를 AuthUser 형태로 좁힌다", () => {
    expect(mapMemberMe({ id: 1, name: "김미담", roles: ["USER"] })).toEqual({
      id: 1,
      name: "김미담",
      roles: ["USER"],
    });
  });

  it("roles 배열을 복제한다 (DTO 참조를 그대로 들고 있지 않는다)", () => {
    const dto = {
      id: 2,
      name: "이공방",
      roles: ["USER", "ARTISAN"] as ("USER" | "ARTISAN" | "ADMIN")[],
    };

    const result = mapMemberMe(dto);

    expect(result.roles).toEqual(["USER", "ARTISAN"]);
    expect(result.roles).not.toBe(dto.roles);
  });
});
