import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const serviceRoot = fileURLToPath(new URL("../", import.meta.url));
const defaultBaseline = fileURLToPath(new URL("./route-bundle-baseline.json", import.meta.url));
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const fail = (message) => { throw new Error(message); };

/** Validate Next's diagnostics against real files before trusting any byte count. */
export function checkRouteBundleBudget({ root = serviceRoot, baselinePath = defaultBaseline } = {}) {
  const stats = JSON.parse(readFileSync(resolve(root, ".next/diagnostics/route-bundle-stats.json"), "utf8"));
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  if (!Array.isArray(stats) || stats.length === 0) fail("Missing route stats");
  if (baseline.version !== 1 || !baseline.routes || Array.isArray(baseline.routes) || typeof baseline.routes !== "object") fail("Invalid baseline format");
  const expectedRoutes = Object.keys(baseline.routes).sort();
  if (expectedRoutes.length === 0 || expectedRoutes.some((route) => !route.startsWith("/") || !integer(baseline.routes[route]))) fail("Invalid baseline routes/bytes");
  const routes = stats.map((row) => row?.route);
  if (routes.some((route) => typeof route !== "string") || new Set(routes).size !== routes.length || JSON.stringify([...routes].sort()) !== JSON.stringify(expectedRoutes)) fail("Route set mismatch");

  const chunkRoot = realpathSync(resolve(root, ".next/static/chunks"));
  const sizes = new Map();
  const results = stats.map((row) => {
    const paths = row.firstLoadChunkPaths;
    if (!integer(row.firstLoadUncompressedJsBytes) || !Array.isArray(paths) || paths.length === 0 || new Set(paths).size !== paths.length) fail(`Invalid bytes/chunks: ${row.route}`);
    let actualBytes = 0;
    for (const path of paths) {
      if (typeof path !== "string" || !path.startsWith(".next/static/chunks/") || !path.endsWith(".js") || path.split("/").includes("..")) fail(`Invalid chunk path: ${path}`);
      if (!sizes.has(path)) {
        const absolute = realpathSync(resolve(root, path));
        const inside = relative(chunkRoot, absolute);
        if (inside.startsWith("..") || isAbsolute(inside)) fail(`Chunk outside build: ${path}`);
        const info = statSync(absolute);
        if (!info.isFile() || info.size === 0) fail(`Invalid chunk file: ${path}`);
        sizes.set(path, info.size);
      }
      actualBytes += sizes.get(path);
    }
    if (!integer(actualBytes) || actualBytes !== row.firstLoadUncompressedJsBytes) fail(`Chunk total mismatch: ${row.route} (stats ${row.firstLoadUncompressedJsBytes}, files ${actualBytes})`);
    const before = baseline.routes[row.route];
    const limit = before + Math.max(10 * 1024, before * 0.02);
    if (actualBytes > limit) fail(`Bundle budget exceeded: ${row.route} (${actualBytes} > ${limit})`);
    return { route: row.route, bytes: actualBytes, baseline: before, limit };
  });
  // A reference build must never silently become the post-migration budget.
  if (baseline.measurementStatus !== "measured") fail("Baseline pending production measurement; record reviewed mini build bytes manually");
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    for (const result of checkRouteBundleBudget()) console.log(`${result.route}: ${result.bytes}B (limit ${result.limit}B)`);
  } catch (error) {
    console.error(`Route bundle budget failed: ${error.message}`);
    process.exitCode = 1;
  }
}
