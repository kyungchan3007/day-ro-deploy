import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ATTRIBUTION_KEY, ATTRIBUTION_TTL, captureAttribution, readAttribution } from "../attribution";
import { isMetaBlockedUrl, sanitizeUrl } from "../url";
import { META_EVENTS, sanitizeParams } from "../events";
import type { AnalyticsEvents, EventName } from "../events";

function context() {
  return {
    url: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer,
    timestamp: Date.now(),
  };
}

async function sendEvent(name: EventName, params: AnalyticsEvents[EventName]) {
  const { trackEvent } = await import("../track");
  trackEvent(name, params);
  await (await import("../dispatch")).flushAnalytics();
}

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    })
  };
}
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
  vi.stubGlobal("window", {
    location: new URL("https://dayro.test/?utm_source=Instagram")
  });
  vi.stubGlobal("document", {
    referrer: "https://ref.test/?email=private&utm_medium=social"
  });
  vi.stubGlobal("localStorage", storage());
  vi.stubGlobal("sessionStorage", storage());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("analytics contract", () => {
  it.each(["development", "test"])("does not create vendor globals in %s", async (env) => {
    vi.stubEnv("NODE_ENV", env);
    const trackEvent = sendEvent;
    await trackEvent("login", {
      method: "kakao"
    });
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
    expect(window.fbq).toBeUndefined();
  });
  it("requires explicit flag and independently gates IDs", async () => {
    const trackEvent = sendEvent;
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "false");
    await trackEvent("page_view", {});
    expect(window.gtag).toBeUndefined();
    expect(window.fbq).toBeUndefined();
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    await trackEvent("page_view", {});
    expect(window.gtag).toBeUndefined();
    expect(window.fbq).toBeDefined();
  });
  it("sanitizes URL credentials, fragment and non-allowlisted query", () => {
    expect(sanitizeUrl("https://user:pass@dayro.test/login?message=PII&error=x&next=x&code=x&state=x&utm_source=instagram&fbclid=f&gclid=g#token")).toBe("https://dayro.test/login?utm_source=instagram&fbclid=f&gclid=g");
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("broken")).toBe("");
  });
  it("initializes before events once, maps every event, and attaches first touch only to GA conversions", async () => {
    const trackEvent = sendEvent;
    for (const name of Object.keys(META_EVENTS) as (keyof typeof META_EVENTS)[])
      await trackEvent(name, {} as never);
    const ga = window.dataLayer!.map(value => Array.from(value as ArrayLike<unknown>));
    expect(ga[0][0]).toBe("js");
    // config에는 페이지 문맥을 고정하지 않는다(자동 이벤트에 첫 진입 URL이 남는 것 방지).
    expect(ga[1]).toEqual(["config", "G-TEST", { send_page_view: false }]);
    expect(ga.filter(args => args[0] === "config")).toHaveLength(1);
    const events = ga.filter(args => args[0] === "event");
    expect(events).toHaveLength(8);
    expect(events[0][2]).not.toHaveProperty("first_utm_source");
    expect(events[1][2]).toMatchObject({
      first_utm_source: "instagram",
      page_location: "https://dayro.test/?utm_source=Instagram",
      page_referrer: "https://ref.test/?utm_medium=social"
    });
    expect(window.fbq!.queue.slice(0, 2).map(v => Array.from(v as ArrayLike<unknown>))).toEqual([["set", "autoConfig", false, "123"], ["init", "123"]]);
    expect(window.fbq!.disablePushState).toBe(true);
    expect(window.fbq!.queue.slice(2).map(v => Array.from(v as ArrayLike<unknown>))).toEqual(Object.values(META_EVENTS).map(mapping => [...mapping, {}]));
  });
  it.each(["/login", "/login/"])("blocks Meta on %s including initialization", async (pathname) => {
    Object.defineProperty(window, "location", {
      value: new URL(`https://dayro.test${pathname}?message=private`)
    });
    const trackEvent = sendEvent;
    await trackEvent("page_view", {});
    await trackEvent("login", {
      method: "kakao"
    });
    expect(window.fbq).toBeUndefined();
    expect(window.dataLayer).toHaveLength(4);
  });
  it.each([
    "https://dayro.test/course/new?step=result&requestId=req-1&candidatePlaces=%5B%7B%22name%22%3A%22cafe%22%7D%5D",
    "https://dayro.test/course/new?step=course&selectedPlaces=%5B%5D",
    "https://dayro.test/?notice=logout",
  ])("blocks Meta but keeps sanitized GA on sensitive query URL %s", async (href) => {
    Object.defineProperty(window, "location", { value: new URL(href) });
    await sendEvent("course_regenerated", { retry_index: 1, remaining_retries: 4 });
    expect(window.fbq).toBeUndefined();
    const events = window.dataLayer!
      .map(value => Array.from(value as ArrayLike<unknown>))
      .filter(args => args[0] === "event");
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events[0])).not.toMatch(/requestId|req-1|cafe|selectedPlaces|notice/);
  });
  it("classifies Meta-blocked URLs by path and non-allowlisted query", () => {
    expect(isMetaBlockedUrl("https://dayro.test/")).toBe(false);
    expect(isMetaBlockedUrl("https://dayro.test/faq?utm_source=instagram&utm_medium=reel&fbclid=f&gclid=g")).toBe(false);
    expect(isMetaBlockedUrl("https://dayro.test/login")).toBe(true);
    expect(isMetaBlockedUrl("https://dayro.test/course/new?step=purpose&purpose=date")).toBe(true);
    expect(isMetaBlockedUrl("https://dayro.test/saved/1?requestId=x")).toBe(true);
    expect(isMetaBlockedUrl("not a url")).toBe(true);
  });
  it("allows only step and 8-char rev on the course flow path (issue #129)", () => {
    expect(isMetaBlockedUrl("https://dayro.test/course/new/?step=result&rev=k3x9ab2m")).toBe(false);
    expect(isMetaBlockedUrl("https://dayro.test/course/new?step=loading&rev=k3x9ab2m&utm_source=instagram")).toBe(false);
    expect(isMetaBlockedUrl("https://dayro.test/course/new/?step=time")).toBe(false);
    expect(isMetaBlockedUrl("https://dayro.test/course/new/?step=result&rev=k3x9ab2m&districtId=11680")).toBe(true);
    expect(isMetaBlockedUrl("https://dayro.test/course/new/?step=result&rev=K3X9AB2M")).toBe(true);
    expect(isMetaBlockedUrl("https://dayro.test/course/new/?step=hacked&rev=k3x9ab2m")).toBe(true);
    expect(isMetaBlockedUrl("https://dayro.test/course/new/?step=result&step=course&rev=k3x9ab2m")).toBe(true);
    expect(isMetaBlockedUrl("https://dayro.test/course/new/?step=result&rev=k3x9ab2m#places")).toBe(true);
    expect(isMetaBlockedUrl("https://dayro.test/saved/1?step=result&rev=k3x9ab2m")).toBe(true);
  });
  it.each(["ga", "meta"])("isolates %s failures", async (vendor) => {
    const { ensureInitialized, enqueueEvent } = await import("../runtime");
    ensureInitialized(context());
    if (vendor === "ga")
      window.gtag = () => {
        throw Error("blocked");
      };
    else
      window.fbq = (() => {
        throw Error("blocked");
      }) as unknown as NonNullable<Window["fbq"]>;
    expect(enqueueEvent("login", {
      method: "kakao"
    }, context())).toEqual(vendor === "ga" ? {
      ga: false,
      meta: true
    } : {
      ga: true,
      meta: false
    });
  });
  it("drops PII and invalid categorical values, including prototype keys", () => {
    expect(sanitizeParams("course_generated", {
      purpose: "private@email.test",
      transport: "walk",
      requestId: "secret",
      user_id: "secret",
      nickname: "secret",
      email: "secret",
      token: "secret",
      place_name: "secret",
      toString: "secret"
    })).toEqual({
      transport: "walk"
    });
    expect(sanitizeParams("course_shared", {
      method: "clipboard",
      url: "private"
    })).toEqual({
      method: "clipboard"
    });
  });
  it("isolates inaccessible storage and global initialization errors", async () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      }
    });
    Object.defineProperty(window, "dataLayer", {
      get() {
        throw Error();
      }
    });
    const { enqueueEvent } = await import("../runtime");
    expect(enqueueEvent("login", {
      method: "kakao"
    }, context())).toEqual({
      ga: false,
      meta: true
    });
  });
  it("suppresses consecutive path effects but counts A to B to A", async () => {
    const { trackPageView } = await import("../runtime");
    const view = (pathname: string) => trackPageView({ ...context(), pathname });
    view("/a");
    view("/a");
    view("/b");
    view("/a");
    expect(window.dataLayer!.map(v => Array.from(v as ArrayLike<unknown>)).filter(args => args[1] === "page_view")).toHaveLength(3);
  });
});
describe("first-touch attribution", () => {
  it("validates whole values, normalizes case, excludes click IDs", () => {
    captureAttribution(`https://dayro.test/?utm_source=Instagram&utm_medium=paid_social&utm_campaign=${"x".repeat(101)}&utm_content=private%40email.test&utm_term=good-1.2&fbclid=secret`, 100);
    expect(readAttribution(100)).toEqual({
      utm_source: "instagram",
      utm_medium: "paid_social",
      utm_term: "good-1.2"
    });
  });
  it("does not overwrite or extend first touch on direct or tagged visits", () => {
    captureAttribution("https://dayro.test", 10);
    expect(localStorage.getItem(ATTRIBUTION_KEY)).toBeNull();
    captureAttribution("https://dayro.test/?utm_source=first", 100);
    captureAttribution("https://dayro.test", 200);
    captureAttribution("https://dayro.test/?utm_source=second", 300);
    expect(readAttribution(300)).toEqual({
      utm_source: "first"
    });
    expect(readAttribution(100 + ATTRIBUTION_TTL)).toEqual({});
    captureAttribution("https://dayro.test/?utm_source=second", 100 + ATTRIBUTION_TTL);
    expect(readAttribution(100 + ATTRIBUTION_TTL)).toEqual({
      utm_source: "second"
    });
  });
  it.each(["invalid", "null", '{"createdAt":999999,"utm":{"utm_source":"future"}}', '{"createdAt":10,"utm":null}'])("recovers corrupt or future record %s", raw => {
    localStorage.setItem(ATTRIBUTION_KEY, raw);
    expect(readAttribution(100)).toEqual({});
    captureAttribution("https://dayro.test/?utm_source=fresh", 100);
    expect(readAttribution(100)).toEqual({
      utm_source: "fresh"
    });
  });
});
