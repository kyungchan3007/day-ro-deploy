import { afterEach, describe, expect, it, vi } from "vitest";

import { getBackendBaseUrl } from "./backend-base-url";

describe("getBackendBaseUrl (issue #139 S10)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the configured backend origin", () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "https://api.dayro.example");
    expect(getBackendBaseUrl()).toBe("https://api.dayro.example");
  });

  it("falls back to localhost outside production", () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getBackendBaseUrl()).toBe("http://localhost:8080");
  });

  it("fails fast at production runtime when unset", () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "");
    expect(() => getBackendBaseUrl()).toThrow("BACKEND_API_BASE_URL");
  });

  it("does not fail during the production build phase", () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    expect(getBackendBaseUrl()).toBe("http://localhost:8080");
  });
});
