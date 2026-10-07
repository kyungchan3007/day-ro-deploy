import { expect, it, vi } from "vitest";
import * as z from "zod/mini";

it("initializes English messages without any classic import", async () => {
  // Clear any inherited locale so classic loaded elsewhere cannot mask a missing initializer.
  const previous = z.config().localeError;
  z.config({ localeError: undefined });
  vi.resetModules();
  try {
    const { kakaoLoginRequestSchema } = await import("../dayro.openapi");
    const result = kakaoLoginRequestSchema.safeParse({ code: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        code: "invalid_type",
        path: ["code"],
        message: "Invalid input: expected string, received number",
      });
    }
  } finally {
    z.config({ localeError: previous });
  }
});
