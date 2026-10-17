#!/usr/bin/env node
/**
 * 번들 분석 (issue #234).
 *
 * 사용: npm run perf:bundle -- --route / [--route /course/new ...] [--skip-build]
 * 1) Turbopack 내장 분석기(`next experimental-analyze -o`) — 실제 배포 번들 기준, 결과 화면을 찍는다.
 * 2) source-map-explorer — 소스맵을 켠 분석용 빌드(`.next-perf`)에서 라우트별 첫 로드 JS 를 트리맵 · JSON 으로 남긴다.
 * 결과: .agents/reports/perf/<날짜>-bundle/ (shots/*.png · sme-*.json · routes.md). 큰 HTML 은 git 에 올리지 않는다.
 */
import { execFileSync, spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { values } = parseArgs({
  options: {
    route: { type: "string", multiple: true, default: ["/"] },
    "skip-build": { type: "boolean", default: false },
    out: { type: "string" },
  },
});
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const outDir = resolve(values.out ?? join(root, ".agents/reports/perf", `${today}-bundle`));
const shotsDir = join(outDir, "shots");
mkdirSync(shotsDir, { recursive: true });
const bin = (name) => join(root, "node_modules/.bin", name);
/**
 * 소스 경로 → 묶음 이름. 패키지는 패키지 이름, 우리 코드는 `src/<레이어>/<슬라이스>` 단위.
 * Turbopack 소스맵 경로(`turbopack:///[project]/...`)는 앞부분을 떼고 본다.
 */
function groupKey(file) {
  const path = file.replace(/^turbopack:\/\/\/\[project\]\//, "");
  if (path.includes("node_modules/")) {
    const rest = path.split("node_modules/").pop().split("/");
    return rest[0].startsWith("@") ? rest.slice(0, 2).join("/") : rest[0];
  }
  if (path.startsWith("[")) return path;
  const srcIndex = path.split("/").indexOf("src");
  return srcIndex >= 0 ? path.split("/").slice(srcIndex, srcIndex + 3).join("/") : path.split("/").slice(0, 2).join("/");
}
const slug = (route) => (route === "/" ? "root" : route.replace(/^\//, "").replace(/[/[\]]+/g, "-"));

// 1) Turbopack 분석기
execFileSync(bin("next"), ["experimental-analyze", "-o"], { cwd: root, stdio: "inherit" });
const analyzeDir = join(root, ".next/diagnostics/analyze");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http
  .createServer((req, res) => {
    let path = decodeURIComponent(req.url.split("?")[0]);
    if (path.endsWith("/")) path += "index.html";
    let file = join(analyzeDir, path);
    if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.statusCode = 404;
      return res.end();
    }
    res.setHeader("content-type", types[extname(file)] ?? "application/octet-stream");
    createReadStream(file).pipe(res);
  })
  .listen(0);
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);
// 분석기는 첫 라우트(알파벳순 API 라우트)로 열린다 → ⌘K 라우트 선택에서 원하는 라우트를 고른 뒤 찍는다.
for (const route of values.route) {
  await page.keyboard.press("ControlOrMeta+k");
  await page.keyboard.type(route);
  const option = page.getByRole("option", { name: route, exact: true });
  if ((await option.count()) === 0) {
    console.warn(`분석기에 라우트 없음: ${route}`);
    await page.keyboard.press("Escape");
    continue;
  }
  await option.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(shotsDir, `turbopack-${slug(route)}.png`) });
  console.log(`찍음: shots/turbopack-${slug(route)}.png`);
}

// 2) source-map-explorer (분석용 빌드)
if (!values["skip-build"]) {
  execFileSync(bin("next"), ["build"], { cwd: root, stdio: "inherit", env: { ...process.env, PERF_SOURCEMAPS: "1" } });
}
const stats = JSON.parse(readFileSync(join(root, ".next-perf/diagnostics/route-bundle-stats.json"), "utf8"));
const lines = ["# 라우트별 첫 로드 JS (source-map-explorer)", "", `- 기준: ${today} 분석용 빌드(.next-perf, 소스맵 포함) · 크기는 압축 전`, ""];
for (const route of values.route) {
  const row = stats.find((item) => item.route === route);
  if (!row) {
    console.warn(`라우트 없음: ${route}`);
    continue;
  }
  const chunks = row.firstLoadChunkPaths.map((path) => join(root, path.replace(/^\.next\//, ".next-perf/")));
  const name = slug(route);
  const htmlPath = join(outDir, `sme-${name}.html`);
  const jsonPath = join(outDir, `sme-${name}.json`);
  const args = [...chunks, "--no-border-checks"];
  writeFileSync(htmlPath, execFileSync(bin("source-map-explorer"), [...args, "--html"], { cwd: root, maxBuffer: 256 * 1024 * 1024 }));
  writeFileSync(jsonPath, execFileSync(bin("source-map-explorer"), [...args, "--json"], { cwd: root, maxBuffer: 256 * 1024 * 1024 }));
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(shotsDir, `sme-${name}.png`) });
  console.log(`찍음: shots/sme-${name}.png`);

  // 패키지 · 폴더 단위 상위 15개
  const result = JSON.parse(readFileSync(jsonPath, "utf8"));
  const groups = new Map();
  for (const bundle of result.results ?? []) {
    for (const [file, info] of Object.entries(bundle.files ?? {})) {
      const key = groupKey(file);
      groups.set(key, (groups.get(key) ?? 0) + (info.size ?? 0));
    }
  }
  const totalBytes = [...groups.values()].reduce((sum, size) => sum + size, 0);
  lines.push(`## ${route} — 합계 ${(totalBytes / 1024).toFixed(1)} KiB`, "", "| 묶음 | 크기 | 비율 |", "| --- | --- | --- |");
  [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([key, size]) => lines.push(`| ${key} | ${(size / 1024).toFixed(1)} KiB | ${((size / totalBytes) * 100).toFixed(1)}% |`));
  lines.push("");
}
writeFileSync(join(outDir, "routes.md"), `${lines.join("\n")}\n`);
console.log(`\n저장: ${outDir}\n${lines.join("\n")}`);
await browser.close();
server.close();
