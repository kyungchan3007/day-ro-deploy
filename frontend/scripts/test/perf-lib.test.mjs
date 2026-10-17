import assert from "node:assert/strict";
import { test } from "node:test";

import { extractMetrics, median, pickRepresentativeRun, summarize, summaryMarkdown } from "../perf/lib.mjs";

const lhr = (score, lcp) => ({
  categories: { performance: { score } },
  audits: {
    "first-contentful-paint": { numericValue: 1000 },
    "largest-contentful-paint": { numericValue: lcp },
    "total-blocking-time": { numericValue: 50 },
    "cumulative-layout-shift": { numericValue: 0.01 },
    "speed-index": { numericValue: 2000 },
    "server-response-time": { numericValue: 300 },
    "total-byte-weight": { numericValue: 500000 },
    "resource-summary": { details: { items: [{ resourceType: "script", transferSize: 200000 }] } },
    "unused-javascript": { details: { overallSavingsBytes: 80000 } },
    "largest-contentful-paint-element": { details: { items: [{ items: [{ node: { snippet: "<h1>" } }] }] } },
  },
});

test("extractMetrics: 점수 · 지표 · 무게 · LCP 요소", () => {
  const metrics = extractMetrics(lhr(0.93, 2900));
  assert.equal(metrics.score, 93);
  assert.equal(metrics.lcp, 2900);
  assert.equal(metrics.ttfb, 300);
  assert.equal(metrics.scriptBytes, 200000);
  assert.equal(metrics.unusedJsBytes, 80000);
  assert.equal(metrics.lcpElement, "<h1>");
});

test("extractMetrics: Lighthouse 13 LCP 요소(lcp-breakdown-insight node)", () => {
  const data = lhr(0.9, 2000);
  data.audits["lcp-breakdown-insight"] = {
    details: { items: [{ type: "table", items: [] }, { type: "node", snippet: "<p class=\"text-center\">", selector: "footer > p" }] },
  };
  assert.equal(extractMetrics(data).lcpElement, '<p class="text-center">');
});

test("extractMetrics: 없는 audit 은 null", () => {
  const metrics = extractMetrics({ categories: {}, audits: {} });
  assert.equal(metrics.score, null);
  assert.equal(metrics.fcp, null);
  assert.equal(metrics.lcpElement, null);
});

test("median: 홀수 · 짝수 · 빈 값", () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([null, Number.NaN]), null);
});

test("pickRepresentativeRun: 점수 중앙값에 가장 가까운 회차, 같으면 LCP 중앙값에 가까운 회차", () => {
  const runs = [90, 95, 93, 93, 80].map((score, i) => extractMetrics(lhr(score / 100, [2000, 2500, 3100, 2800, 4000][i])));
  // 점수 중앙값 93 → 3번(3100) · 4번(2800) 후보, LCP 중앙값 2800 → 4번
  assert.equal(pickRepresentativeRun(runs), 3);
  assert.equal(pickRepresentativeRun([]), -1);
});

test("summarize · summaryMarkdown: 중앙값 줄과 대표 표시", () => {
  const runs = [0.9, 0.95, 0.93].map((score) => extractMetrics(lhr(score, 2500)));
  assert.equal(summarize(runs).score, 93);
  const md = summaryMarkdown({
    title: "home",
    url: "https://day-ro.com/",
    env: "운영",
    runs,
    representative: 2,
    settings: { lighthouseVersion: "13.5.0", formFactor: "mobile", throttlingMethod: "simulate", width: 412, height: 823 },
  });
  assert.match(md, /\| 3 \(대표\) \|/);
  assert.match(md, /\*\*중앙값\*\*/);
  assert.match(md, /\*\*93\*\*/);
});
