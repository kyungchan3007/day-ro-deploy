import { describe, expect, it } from "vitest";

import { homeStatic } from "../../../shared/static/home";

describe("Home domain", () => {
  it("hands off the create entry to the course route", () => {
    expect(homeStatic.cards.create.href).toBe("/course/new");
  });

  it("keeps the saved entry copy separate from the create flow", () => {
    expect(homeStatic.cards.saved.title).toContain("찜한 코스");
    expect(homeStatic.cards.saved.subtitle).toContain("\n");
    expect(homeStatic.cards.saved.href).toBe("#");
  });
});
