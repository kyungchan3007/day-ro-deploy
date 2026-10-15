import { describe, expect, it } from "vitest";

import {
  GUEST_BROWSE_COOKIE_NAME,
  buildGuestBrowseCookie,
  resolveRootEntry,
} from "../model/root-entry";

const guest = { hasAccessToken: false, hasRefreshToken: false, guestBrowse: undefined };

describe("resolveRootEntry (issue #230)", () => {
  it("비회원 첫 방문은 시작 화면", () => {
    expect(resolveRootEntry(guest)).toBe("start");
  });

  it("access 또는 refresh 쿠키가 있으면 회원 → 홈", () => {
    expect(resolveRootEntry({ ...guest, hasAccessToken: true })).toBe("home");
    expect(resolveRootEntry({ ...guest, hasRefreshToken: true })).toBe("home");
  });

  it("이번 방문에서 둘러보기를 고른 비회원은 홈", () => {
    expect(resolveRootEntry({ ...guest, guestBrowse: "1" })).toBe("home");
  });

  it("둘러보기 쿠키 값이 다르면 시작 화면", () => {
    expect(resolveRootEntry({ ...guest, guestBrowse: "yes" })).toBe("start");
    expect(resolveRootEntry({ ...guest, guestBrowse: "" })).toBe("start");
  });
});

describe("buildGuestBrowseCookie", () => {
  it("만료 없는 세션 쿠키 · 전체 경로 · Lax", () => {
    const cookie = buildGuestBrowseCookie(false);
    expect(cookie).toBe(`${GUEST_BROWSE_COOKIE_NAME}=1; path=/; SameSite=Lax`);
    expect(cookie).not.toMatch(/max-age|expires/i);
  });

  it("https 에서는 Secure", () => {
    expect(buildGuestBrowseCookie(true)).toMatch(/; Secure$/);
  });
});
