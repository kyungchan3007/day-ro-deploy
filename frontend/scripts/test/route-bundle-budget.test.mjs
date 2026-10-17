import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkRouteBundleBudget } from "../check-route-bundle-budget.mjs";

function fixture(t, bytes = 100) {
  const root = mkdtempSync(join(tmpdir(), "dayro-budget-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".next/diagnostics"), { recursive: true });
  mkdirSync(join(root, ".next/static/chunks"), { recursive: true });
  const chunk = ".next/static/chunks/shared.js";
  writeFileSync(join(root, chunk), Buffer.alloc(bytes, 32));
  const stats = ["/", "/course/new"].map((route) => ({ route, firstLoadUncompressedJsBytes: bytes, firstLoadChunkPaths: [chunk] }));
  const baseline = { version: 1, measurementStatus: "measured", routes: { "/": bytes, "/course/new": bytes } };
  const baselinePath = join(root, "baseline.json");
  const statsPath = join(root, ".next/diagnostics/route-bundle-stats.json");
  const save = () => {
    writeFileSync(statsPath, JSON.stringify(stats));
    writeFileSync(baselinePath, JSON.stringify(baseline));
  };
  save();
  return { root, baselinePath, statsPath, stats, baseline, save };
}

test("accepts measured totals and counts shared chunks once per route", (t) => {
  assert.equal(checkRouteBundleBudget(fixture(t)).length, 2);
});
for (const [name, change, error] of [
  ["budget exceeded", (f) => { f.baseline.routes['/'] = 0; }, /budget exceeded/],
  ["route missing", (f) => { f.stats.pop(); }, /Route set mismatch/],
  ["extra route", (f) => { f.stats.push({ ...f.stats[0], route: '/extra' }); }, /Route set mismatch/],
  ["duplicate route", (f) => { f.stats[1].route = '/'; }, /Route set mismatch/],
  ["chunk missing", (f) => { f.stats[0].firstLoadChunkPaths = ['.next/static/chunks/missing.js']; }, /ENOENT/],
  ["total mismatch", (f) => { f.stats[0].firstLoadUncompressedJsBytes++; }, /total mismatch/],
  ["duplicate chunk", (f) => { f.stats[0].firstLoadChunkPaths.push(f.stats[0].firstLoadChunkPaths[0]); }, /Invalid bytes\/chunks/],
  ["empty chunk list", (f) => { f.stats[0].firstLoadChunkPaths = []; }, /Invalid bytes\/chunks/],
  ["invalid byte count", (f) => { f.stats[0].firstLoadUncompressedJsBytes = -1; }, /Invalid bytes\/chunks/],
  ["path traversal", (f) => { f.stats[0].firstLoadChunkPaths = ['.next/static/chunks/../outside.js']; }, /Invalid chunk path/],
  ["pending measurement", (f) => { f.baseline.measurementStatus = 'pending-mini-build'; }, /pending production measurement/],
]) {
  test(`rejects ${name}`, (t) => {
    const f = fixture(t, 20_000);
    change(f); f.save();
    assert.throws(() => checkRouteBundleBudget(f), error);
  });
}
test("rejects missing stats", (t) => {
  const f = fixture(t);
  rmSync(f.statsPath);
  assert.throws(() => checkRouteBundleBudget(f), /ENOENT/);
});
test("rejects unsupported stats format", (t) => {
  const f = fixture(t);
  writeFileSync(f.statsPath, '{}');
  assert.throws(() => checkRouteBundleBudget(f), /Missing route stats/);
});
for (const baselineBytes of [100, 1_000_000]) {
  test(`accepts exact allowance and rejects one byte over (baseline ${baselineBytes})`, (t) => {
    const limit = baselineBytes + Math.max(10_240, baselineBytes * 0.02);
    const f = fixture(t, limit);
    for (const route of Object.keys(f.baseline.routes)) f.baseline.routes[route] = baselineBytes;
    f.save();
    assert.equal(checkRouteBundleBudget(f)[0].limit, limit);
    writeFileSync(join(f.root, f.stats[0].firstLoadChunkPaths[0]), Buffer.alloc(limit + 1, 32));
    f.stats.forEach((row) => row.firstLoadUncompressedJsBytes++);
    f.save();
    assert.throws(() => checkRouteBundleBudget(f), /budget exceeded/);
  });
}
