#!/usr/bin/env node
/**
 * 증거 스크린샷 (issue #234).
 *
 * 사용: npm run perf:shots -- --dir .agents/reports/perf/<측정 폴더>
 * - representative.report.html 에서 점수 · 지표 · 필름스트립 · 인사이트 · 진단 영역을 잘라 찍는다.
 * - summary.md 의 회차별 · 중앙값 표를 이미지로 만든다.
 * - 결과: <dir>/shots/*.png (노션 성능개선 TASK 행 본문에 올리는 용도)
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";

const { values } = parseArgs({ options: { dir: { type: "string" } } });
if (!values.dir) {
  console.error("사용: npm run perf:shots -- --dir <측정 폴더>");
  process.exit(1);
}
const dir = resolve(values.dir);
const shotsDir = join(dir, "shots");
mkdirSync(shotsDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });

await page.goto(`file://${join(dir, "representative.report.html")}`);
await page.waitForSelector("#performance .lh-category-header");
// 인사이트 · 진단 항목은 펼쳐서 찍는다(근거 수치가 보이게).
await page.evaluate(() => document.querySelectorAll("#performance details").forEach((el) => { el.open = true; }));
await page.waitForTimeout(300);
const sections = [
  ["01-score", "#performance .lh-category-header"],
  ["02-metrics", "#performance .lh-audit-group--metrics"],
  ["03-filmstrip", "#performance .lh-filmstrip-container"],
  ["04-insights", "#performance .lh-audit-group--insights"],
  ["05-diagnostics", "#performance .lh-audit-group--diagnostics"],
];
for (const [name, selector] of sections) {
  const target = page.locator(selector).first();
  if ((await target.count()) === 0) {
    console.warn(`건너뜀: ${name} (${selector} 없음)`);
    continue;
  }
  await target.screenshot({ path: join(shotsDir, `${name}.png`) });
  console.log(`찍음: shots/${name}.png`);
}

// 경고 · 실패 항목은 하나씩 따로(펼친 상태) — 진단 근거
const failing = page.locator(
  "#performance .lh-audit-group--insights .lh-audit--fail, #performance .lh-audit-group--insights .lh-audit--average, #performance .lh-audit-group--diagnostics .lh-audit--fail, #performance .lh-audit-group--diagnostics .lh-audit--average",
);
const failingCount = await failing.count();
for (let i = 0; i < failingCount; i += 1) {
  const item = failing.nth(i);
  const id = (await item.getAttribute("id")) ?? `item-${i + 1}`;
  await item.screenshot({ path: join(shotsDir, `10-${String(i + 1).padStart(2, "0")}-${id}.png`) });
  console.log(`찍음: shots/10-${String(i + 1).padStart(2, "0")}-${id}.png`);
}

// 회차별 · 중앙값 표
const md = readFileSync(join(dir, "summary.md"), "utf8");
const lines = md.split("\n");
const tableLines = lines.filter((line) => line.startsWith("|"));
const meta = lines.filter((line) => line.startsWith("- ")).map((line) => line.slice(2));
const cells = (line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/\*\*/g, ""));
const [head, , ...body] = tableLines;
const escape = (text) => text.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]);
const html = `<!doctype html><meta charset="utf-8"><style>
body{font:14px/1.5 -apple-system,"Apple SD Gothic Neo",sans-serif;margin:24px;color:#111}
h1{font-size:18px;margin:0 0 8px} ul{margin:0 0 12px;padding-left:18px;color:#555;font-size:12px}
table{border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px 10px;text-align:right;white-space:nowrap}
th{background:#f6f6f6} td:first-child,th:first-child{text-align:left} tr:last-child td{font-weight:700;background:#faf5ff}
</style><h1>${escape(lines[0].replace(/^# /, ""))}</h1><ul>${meta.map((m) => `<li>${escape(m)}</li>`).join("")}</ul>
<table><tr>${cells(head).map((c) => `<th>${escape(c)}</th>`).join("")}</tr>${body
  .map((row) => `<tr>${cells(row).map((c) => `<td>${escape(c)}</td>`).join("")}</tr>`)
  .join("")}</table>`;
await page.setContent(html);
await page.locator("body").screenshot({ path: join(shotsDir, "00-runs-table.png") });
console.log("찍음: shots/00-runs-table.png");
await browser.close();
