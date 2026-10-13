import { describe, expect, it } from "vitest";
import * as contracts from "../dayro.openapi";
import fixture from "./classic-contract-cases.json";

// Expectations were captured from classic before migration. No classic runtime import.
const schemas = Object.fromEntries(
  Object.entries(contracts).filter(([, value]) => "safeParse" in value),
);

describe("public contracts preserve frozen classic outcomes", () => {
  it.each(fixture.cases)("$schema: $name", ({ schema, input, expected }) => {
    const contract = schemas[schema];
    if (!("safeParse" in contract)) throw new Error(`Missing schema: ${schema}`);
    const result = contract.safeParse(input);
    const actual = result.success
      ? { success: true, data: result.data }
      : {
          success: false,
          issues: result.error.issues.map(({ code, path, message }) => ({ code, path, message })),
        };
    expect(actual).toEqual(expected);
  });
});
