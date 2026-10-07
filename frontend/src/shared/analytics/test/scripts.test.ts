import { afterEach, beforeEach, expect, it, vi } from "vitest";

// root leaf(AnalyticsTracker)는 pathname 구독 + 활성 gate만 정적으로 갖고,
// 벤더 SDK 주입은 지연 로드된 runtime이 stub 초기화 후에 수행한다(SDD 로딩 전략).

const react = vi.hoisted(() => ({
  pathname: "/",
  effect: undefined as undefined | (() => void),
}));

vi.mock("next/navigation", () => ({ usePathname: () => react.pathname }));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useEffect: (effect: () => void) => {
    react.effect = effect;
  },
}));

interface FakeScript {
  id: string;
  async: boolean;
  src: string;
  onerror: (() => void) | null;
}

function fakeDocument() {
  const appended: FakeScript[] = [];
  return {
    appended,
    document: {
      referrer: "",
      createElement: vi.fn(() => ({ id: "", async: false, src: "", onerror: null }) as FakeScript),
      getElementById: vi.fn((id: string) => appended.find((script) => script.id === id) ?? null),
      head: {
        appendChild: vi.fn((script: FakeScript) => {
          appended.push(script);
        }),
      },
    },
  };
}

function enableAnalytics() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
}

async function runRootEffect() {
  const { AnalyticsTracker } = await import("../AnalyticsTracker");
  expect(AnalyticsTracker()).toBeNull();
  react.effect?.();
  await (await import("../dispatch")).flushAnalytics();
}

let dom: ReturnType<typeof fakeDocument>;

beforeEach(() => {
  vi.resetModules();
  react.pathname = "/";
  react.effect = undefined;
  dom = fakeDocument();
  vi.stubGlobal("window", { location: new URL("https://dayro.test/") });
  vi.stubGlobal("document", dom.document);
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each(["development", "test", "production"])(
  "injects nothing and creates no vendor globals without opt-in in %s",
  async (env) => {
    vi.stubEnv("NODE_ENV", env);
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_ENABLED", "false");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");

    await runRootEffect();

    expect(dom.appended).toEqual([]);
    expect(window.gtag).toBeUndefined();
    expect(window.fbq).toBeUndefined();
  },
);

it("injects each vendor SDK once, only after its stub queue is initialized", async () => {
  enableAnalytics();
  dom.document.head.appendChild.mockImplementation((script: FakeScript) => {
    // SDK 주입 시점에 이미 공식 stub과 config/init 명령이 큐에 있어야 한다.
    if (script.id === "dayro-meta") {
      const commands = window.fbq!.queue.map((value) => Array.from(value as ArrayLike<unknown>));
      expect(commands.slice(0, 2)).toEqual([
        ["set", "autoConfig", false, "123"],
        ["init", "123"],
      ]);
    }
    if (script.id === "dayro-ga") {
      expect(window.dataLayer!.length).toBeGreaterThanOrEqual(2);
    }
    dom.appended.push(script);
  });

  await runRootEffect();
  react.pathname = "/faq";
  vi.stubGlobal("window", { ...window, location: new URL("https://dayro.test/faq") });
  await runRootEffect();

  expect(dom.appended.map((script) => script.id)).toEqual(["dayro-ga", "dayro-meta"]);
  expect(dom.appended.every((script) => script.async)).toBe(true);
  expect(dom.appended[0].src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST");
  expect(dom.appended[1].src).toBe("https://connect.facebook.net/en_US/fbevents.js");
});

it("does not inject or initialize Meta on /login", async () => {
  enableAnalytics();
  react.pathname = "/login/";
  vi.stubGlobal("window", { location: new URL("https://dayro.test/login/?error=oauth_cancelled") });

  await runRootEffect();

  expect(dom.appended.map((script) => script.id)).toEqual(["dayro-ga"]);
  expect(window.fbq).toBeUndefined();
});

it("skips a vendor whose initialization failed and keeps the other", async () => {
  enableAnalytics();
  vi.stubGlobal("window", {
    location: new URL("https://dayro.test/"),
    gtag: () => {
      throw new Error("blocked");
    },
  });

  await runRootEffect();

  expect(dom.appended.map((script) => script.id)).toEqual(["dayro-meta"]);
});

it("isolates DOM injection failures from the event pipeline", async () => {
  enableAnalytics();
  dom.document.head.appendChild.mockImplementation(() => {
    throw new Error("CSP blocked");
  });

  await expect(runRootEffect()).resolves.toBeUndefined();
  const { trackEvent } = await import("../track");
  expect(() => trackEvent("login", { method: "kakao" })).not.toThrow();
});
