import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { allCatalogTokenNames } from "./token-catalog";

const globalsCss = readFileSync(path.resolve(__dirname, "../../../app/globals.css"), "utf8");
const definedTokens = new Set(
  [...globalsCss.matchAll(/^\s*(--(?:color|text|radius|shadow|duration|ease|z)-[a-z0-9-]+):/gm)].map(
    (match) => match[1],
  ),
);

describe("토큰 목록 ↔ globals.css", () => {
  it("목록의 토큰은 모두 globals.css 에 정의돼 있다", () => {
    const missing = allCatalogTokenNames().filter((name) => !definedTokens.has(name));
    expect(missing).toEqual([]);
  });

  it("globals.css 의 토큰은 모두 목록(스토리북 문서)에 있다", () => {
    const catalog = new Set(allCatalogTokenNames());
    const undocumented = [...definedTokens].filter((name) => !catalog.has(name));
    expect(undocumented).toEqual([]);
  });

  it("목록에 같은 토큰이 두 번 나오지 않는다", () => {
    const names = allCatalogTokenNames();
    expect(names.length).toBe(new Set(names).size);
  });
});
