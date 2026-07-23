import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

const mode = process.argv[2] ?? "ci";
const repoRoot = resolve(process.cwd(), "..");
const serviceRoot = process.cwd();
const serviceName = basename(serviceRoot);
const mapPath = resolve(serviceRoot, "e2e-impact-map.json");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: options.cwd ?? serviceRoot,
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    shell: false,
  });

  if (result.status !== 0) {
    return "";
  }

  return result.stdout.trim();
}

function normalize(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function hasGlobPattern(pattern) {
  return /[*?[\]{}]/.test(pattern);
}

function gitBaseRef() {
  if (process.env.GITHUB_BASE_REF) {
    return `origin/${process.env.GITHUB_BASE_REF}`;
  }

  return process.env.E2E_BASE_REF ?? "HEAD~1";
}

function changedFiles() {
  if (process.env.E2E_CHANGED_FILES) {
    return process.env.E2E_CHANGED_FILES.split(/\r?\n/)
      .map((item) => normalize(item.trim()))
      .filter(Boolean);
  }

  const base = gitBaseRef();
  const output = capture("git", ["diff", "--name-only", `${base}...HEAD`]);
  if (output) {
    return output.split(/\r?\n/).map(normalize).filter(Boolean);
  }

  const fallback = capture("git", ["diff", "--name-only", "HEAD~1..HEAD"]);
  return fallback.split(/\r?\n/).map(normalize).filter(Boolean);
}

function pathMatches(path, pattern) {
  const normalizedPattern = normalize(pattern);

  if (hasGlobPattern(normalizedPattern)) {
    const escaped = normalizedPattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replaceAll("**", ".*")
      .replaceAll("*", "[^/]*");
    return new RegExp(`^${escaped}$`).test(path);
  }

  return path === normalizedPattern || path.startsWith(normalizedPattern);
}

function listSpecs(patterns) {
  const args = ["--files", ...patterns.map((pattern) => normalize(pattern))];
  const output = capture("git", args, { cwd: serviceRoot });

  const tracked = output
    .split(/\r?\n/)
    .map((item) => normalize(item.trim()))
    .filter((item) => item.endsWith(".spec.ts"));

  return [...new Set([...tracked, ...listLocalSpecs()])];
}

function listLocalSpecs(dir = resolve(serviceRoot, "src/app/e2e")) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) return listLocalSpecs(path);
    if (!entry.name.endsWith(".spec.ts")) return [];
    return normalize(relative(serviceRoot, path));
  });
}

function toServiceRelative(path) {
  const servicePrefix = `${serviceName}/`;
  if (path.startsWith(servicePrefix)) {
    return path.slice(servicePrefix.length);
  }

  if (!path.startsWith("../") && !path.startsWith("/")) {
    return path;
  }

  const absolute = resolve(repoRoot, path);
  return normalize(relative(serviceRoot, absolute));
}

const map = JSON.parse(readFileSync(mapPath, "utf8"));
const changed = changedFiles();
const hasServiceChanges = changed.some((file) =>
  map.serviceRoots.some((root) => pathMatches(file, root)),
);

if (!hasServiceChanges) {
  console.log(`No ${serviceName} changes detected. Skipping Vitest and e2e.`);
  process.exit(0);
}

const allSpecs = listSpecs(map.defaultSpecs);
const affectedSpecs = new Set();

for (const mapping of map.mappings) {
  const matched = changed.some((file) =>
    mapping.changed.some((pattern) => pathMatches(file, pattern)),
  );

  if (!matched) continue;

  for (const spec of mapping.specs) {
    const relativeSpec = toServiceRelative(spec);
    if (existsSync(resolve(serviceRoot, relativeSpec))) {
      affectedSpecs.add(relativeSpec);
    }
  }
}

const affected = [...affectedSpecs];
const remaining = allSpecs.filter((spec) => !affectedSpecs.has(spec));

function runPlaywright(specs, label) {
  if (specs.length === 0) {
    console.log(`No ${label} e2e specs to run.`);
    return;
  }

  run("npx", ["playwright", "test", ...specs]);
}

if (mode === "affected") {
  runPlaywright(affected, "affected");
} else if (mode === "remaining") {
  runPlaywright(remaining, "remaining");
} else if (mode === "ci") {
  run("npm", ["run", "test:unit"]);
  runPlaywright(affected, "affected");
  runPlaywright(remaining, "remaining");
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}
