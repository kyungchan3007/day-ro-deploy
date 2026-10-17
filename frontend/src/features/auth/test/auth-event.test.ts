import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { setAuthEventCookie } from "@/shared/api/server-auth-event";
function context() {
  return {
    url: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer,
    timestamp: Date.now(),
  };
}

const order: string[] = [];
let cookie = "";
let records: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  order.length = 0;
  records = new Map();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
  cookie = `dayro_auth_event=${encodeURIComponent(JSON.stringify({
    type: "sign_up",
    eventId: "event-1"
  }))}`;
  vi.stubGlobal("document", {
    referrer: "",
    get cookie() {
      return cookie;
    },
    set cookie(value) {
      order.push("delete");
      cookie = value;
    }
  });
  vi.stubGlobal("window", {
    location: new URL("https://dayro.test/"),
    gtag: (...args: unknown[]) => {
      if (args[0] === "event") {
        order.push("ga");
      }
    },
    fbq: (...args: unknown[]) => {
      if (args[0] === "track") {
        order.push("meta");
      }
    }
  });
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => {
      order.push("check");
      return records.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      order.push("record");
      records.set(key, value);
    }
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("checks, enqueues both vendors, records, then deletes; survives module reload", async () => {
  const original = cookie;
  (await import("../model/auth-event")).consumeAuthEvent(context());
  expect(order).toEqual(["check", "ga", "meta", "record", "delete"]);
  cookie = original;
  order.length = 0;
  vi.resetModules();
  (await import("../model/auth-event")).consumeAuthEvent(context());
  expect(order).toEqual(["check", "record", "delete"]);
});
it("retries only failed vendors before deleting", async () => {
  window.gtag = () => {
    throw Error("blocked");
  };
  const { consumeAuthEvent } = await import("../model/auth-event");
  consumeAuthEvent(context());
  expect(order).toEqual(["check", "meta", "record"]);
  window.gtag = (...args) => {
    if (args[0] === "event") {
      order.push("ga");
    }
  };
  order.length = 0;
  consumeAuthEvent(context());
  expect(order).toEqual(["check", "ga", "record", "delete"]);
});
it("ignores malformed signals and tolerates inaccessible storage", async () => {
  const { consumeAuthEvent } = await import("../model/auth-event");
  cookie = "dayro_auth_event=broken";
  expect(() => consumeAuthEvent(context())).not.toThrow();
  expect(order).toEqual([]);
  cookie = `dayro_auth_event=${encodeURIComponent(JSON.stringify({
    type: "invalid",
    eventId: "x"
  }))}`;
  consumeAuthEvent(context());
  expect(order).toEqual(["delete"]);
});
it.each([true, false])("sets a short-lived non-token cookie for isNewUser=%s", isNewUser => {
  const response = new NextResponse();
  setAuthEventCookie(response, isNewUser);
  const value = response.cookies.get("dayro_auth_event")!;
  expect(JSON.parse(value.value)).toEqual({
    type: isNewUser ? "sign_up" : "login",
    eventId: expect.any(String)
  });
  const header = response.headers.get("set-cookie")!;
  expect(header).toContain("Path=/");
  expect(header).toContain("Max-Age=300");
  expect(header).toContain("Secure");
  expect(header).toContain("SameSite=lax");
  expect(header).not.toContain("HttpOnly");
  expect(header).not.toContain("Domain");
});
