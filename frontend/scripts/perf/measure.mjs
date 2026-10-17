#!/usr/bin/env node
/**
 * Lighthouse 반복 측정 (issue #234).
 *
 * 사용: npm run perf:measure -- --url https://day-ro.com/ --name home --env prod [--runs 5] [--cookie "k=v; k2=v2"] [--out <dir>]
 * - --cookie: 요청에 쿠키를 실어 특정 상태로 측정한다(예: 홈 = 둘러보기 비회원 `dayro_guest_browse=1`, issue #236).
 * - 모바일 시뮬레이션(Lighthouse 기본: 412×823 · 느린 4G · CPU 4배) 으로 N회 측정한다.
 * - 회차마다 JSON · HTML · trace · devtools log 를 raw/ 에 남기고, 대표 회차를 representative.* 로 복사한다.
 * - summary.md (회차별 · 중앙값 표) · summary.json 을 만든다. raw/ 와 대표 보고서는 용량이 커서 git 에 올리지 않는다(.gitignore).
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { extractMetrics, pickRepresentativeRun, summarize, summaryMarkdown } from "./lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { values } = parseArgs({
  options: {
    url: { type: "string" },
    name: { type: "string" },
    env: { type: "string", default: "prod" },
    runs: { type: "string", default: "5" },
    cookie: { type: "string" },
    out: { type: "string" },
  },
});
if (!values.url || !values.name) {
  console.error("사용: npm run perf:measure -- --url <URL> --name <화면 이름> [--env prod|local] [--runs 5]");
  process.exit(1);
}

const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 날짜
const outDir = resolve(values.out ?? join(root, ".agents/reports/perf", `${today}-${values.name}-${values.env}`));
const rawDir = join(outDir, "raw");
mkdirSync(rawDir, { recursive: true });

const lighthouseBin = join(root, "node_modules/.bin/lighthouse");
const runs = [];
let settings = null;
const total = Number(values.runs);
for (let i = 1; i <= total; i += 1) {
  const base = join(rawDir, `run-${i}`);
  console.log(`[${i}/${total}] ${values.url}`);
  execFileSync(
    lighthouseBin,
    [
      values.url,
      "--only-categories=performance",
      "--output=json",
      "--output=html",
      `--output-path=${base}`,
      "--save-assets",
      ...(values.cookie ? [`--extra-headers=${JSON.stringify({ Cookie: values.cookie })}`] : []),
      "--chrome-flags=--headless=new",
      "--quiet",
    ],
    { stdio: "inherit" },
  );
  const lhr = JSON.parse(readFileSync(`${base}.report.json`, "utf8"));
  settings ??= {
    lighthouseVersion: lhr.lighthouseVersion,
    formFactor: lhr.configSettings.formFactor,
    throttlingMethod: lhr.configSettings.throttlingMethod,
    width: lhr.configSettings.screenEmulation.width,
    height: lhr.configSettings.screenEmulation.height,
    fetchTime: lhr.fetchTime,
    userAgent: lhr.environment?.networkUserAgent,
    benchmarkIndex: lhr.environment?.benchmarkIndex,
    hostUserAgent: lhr.environment?.hostUserAgent,
    cookie: values.cookie ?? null,
  };
  runs.push(extractMetrics(lhr));
}

const representative = pickRepresentativeRun(runs);
const repBase = join(rawDir, `run-${representative + 1}`);
copyFileSync(`${repBase}.report.html`, join(outDir, "representative.report.html"));
copyFileSync(`${repBase}.report.json`, join(outDir, "representative.report.json"));
copyFileSync(`${repBase}-0.trace.json`, join(outDir, "representative.trace.json"));

const title = `${values.name} · ${values.env === "prod" ? "운영" : "로컬 운영 빌드"} · ${today}`;
writeFileSync(join(outDir, "summary.md"), summaryMarkdown({ title, url: values.url, env: values.env, runs, representative, settings }));
writeFileSync(
  join(outDir, "summary.json"),
  `${JSON.stringify({ url: values.url, name: values.name, env: values.env, date: today, settings, representative: representative + 1, median: summarize(runs), runs }, null, 2)}\n`,
);
console.log(`\n저장: ${outDir}\n${readFileSync(join(outDir, "summary.md"), "utf8")}`);
