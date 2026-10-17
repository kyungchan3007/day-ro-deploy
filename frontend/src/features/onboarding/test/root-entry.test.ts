import { describe, expect, it } from "vitest";

import { resolveRootEntry } from "../model/root-entry";

describe("resolveRootEntry (issue #230 · #244)", () => {
  it("로그인 쿠키가 없으면 비회원", () => {
    expect(resolveRootEntry({ hasAccessToken: false, hasRefreshToken: false })).toBe("guest");
  });

  it("access 또는 refresh 쿠키가 있으면 회원", () => {
    expect(resolveRootEntry({ hasAccessToken: true, hasRefreshToken: false })).toBe("member");
    expect(resolveRootEntry({ hasAccessToken: false, hasRefreshToken: true })).toBe("member");
  });
});
