/**
 * 성능 측정 공용 계산 (scripts/perf, issue #234).
 * Lighthouse 결과(lhr)에서 지표를 꺼내고, N회 측정의 중앙값 · 대표 회차를 고른다.
 */

/** Lighthouse audit id → 보고서에 쓰는 지표 이름. */
export const METRICS = [
  { key: "fcp", audit: "first-contentful-paint", label: "FCP", unit: "ms" },
  { key: "lcp", audit: "largest-contentful-paint", label: "LCP", unit: "ms" },
  { key: "tbt", audit: "total-blocking-time", label: "TBT", unit: "ms" },
  { key: "cls", audit: "cumulative-layout-shift", label: "CLS", unit: "" },
  { key: "si", audit: "speed-index", label: "Speed Index", unit: "ms" },
  { key: "ttfb", audit: "server-response-time", label: "TTFB", unit: "ms" },
];

/** lhr 하나에서 점수 · 지표 · 무게를 꺼낸다. */
export function extractMetrics(lhr) {
  const audit = (id) => lhr.audits?.[id];
  const numeric = (id) => {
    const value = audit(id)?.numericValue;
    return typeof value === "number" ? value : null;
  };
  const resourceItems = audit("resource-summary")?.details?.items ?? [];
  const resourceBytes = (type) => resourceItems.find((item) => item.resourceType === type)?.transferSize ?? null;
  // Lighthouse 13 은 LCP 요소를 lcp-breakdown-insight 의 node 항목에 둔다(12 이하는 largest-contentful-paint-element).
  const lcpNode =
    audit("lcp-breakdown-insight")?.details?.items?.find((item) => item.type === "node") ??
    audit("largest-contentful-paint-element")?.details?.items?.[0]?.items?.[0]?.node;
  const lcpElement = lcpNode ? (lcpNode.snippet ?? lcpNode.selector ?? null) : null;
  const metrics = Object.fromEntries(METRICS.map((metric) => [metric.key, numeric(metric.audit)]));
  return {
    score: typeof lhr.categories?.performance?.score === "number" ? Math.round(lhr.categories.performance.score * 100) : null,
    ...metrics,
    totalBytes: numeric("total-byte-weight"),
    scriptBytes: resourceBytes("script"),
    unusedJsBytes: audit("unused-javascript")?.details?.overallSavingsBytes ?? null,
    lcpElement,
  };
}

/** 숫자 배열의 중앙값 (짝수 개면 가운데 두 값 평균). 비어 있으면 null. */
export function median(values) {
  const sorted = values.filter((value) => typeof value === "number" && !Number.isNaN(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/**
 * 대표 회차 고르기: 점수 중앙값에 가장 가까운 회차, 같으면 LCP 중앙값에 가까운 회차.
 * (Lighthouse 권장처럼 한 회차의 보고서 · trace 를 증거로 쓰기 위함 — 지표 표는 지표별 중앙값을 따로 쓴다.)
 * @returns 대표 회차 index
 */
export function pickRepresentativeRun(runs) {
  if (runs.length === 0) return -1;
  const scoreMedian = median(runs.map((run) => run.score));
  const lcpMedian = median(runs.map((run) => run.lcp));
  let best = 0;
  runs.forEach((run, index) => {
    const distance = (candidate) => [Math.abs((candidate.score ?? 0) - (scoreMedian ?? 0)), Math.abs((candidate.lcp ?? 0) - (lcpMedian ?? 0))];
    const [scoreGap, lcpGap] = distance(run);
    const [bestScoreGap, bestLcpGap] = distance(runs[best]);
    if (scoreGap < bestScoreGap || (scoreGap === bestScoreGap && lcpGap < bestLcpGap)) best = index;
  });
  return best;
}

/** 지표별 중앙값. */
export function summarize(runs) {
  const keys = ["score", ...METRICS.map((metric) => metric.key), "totalBytes", "scriptBytes", "unusedJsBytes"];
  return Object.fromEntries(keys.map((key) => [key, median(runs.map((run) => run[key]))]));
}

function format(key, value) {
  if (value === null || value === undefined) return "-";
  if (key === "cls") return value.toFixed(3);
  if (key === "score") return String(Math.round(value));
  if (key.endsWith("Bytes")) return `${(value / 1024).toFixed(1)} KiB`;
  return `${Math.round(value)} ms`;
}

/** 회차별 + 중앙값 표 (마크다운). */
export function summaryMarkdown({ title, url, env, runs, representative, settings }) {
  const columns = [
    ["score", "점수"],
    ...METRICS.map((metric) => [metric.key, metric.label]),
    ["scriptBytes", "JS 전송"],
    ["unusedJsBytes", "안 쓰는 JS"],
  ];
  const header = `| 회차 | ${columns.map(([, label]) => label).join(" | ")} |`;
  const divider = `| --- | ${columns.map(() => "---").join(" | ")} |`;
  const rows = runs.map(
    (run, index) =>
      `| ${index + 1}${index === representative ? " (대표)" : ""} | ${columns.map(([key]) => format(key, run[key])).join(" | ")} |`,
  );
  const med = summarize(runs);
  const medianRow = `| **중앙값** | ${columns.map(([key]) => `**${format(key, med[key])}**`).join(" | ")} |`;
  return [
    `# ${title}`,
    "",
    `- URL: ${url}`,
    `- 환경: ${env}`,
    `- 조건: Lighthouse ${settings.lighthouseVersion} · ${settings.formFactor} · ${settings.throttlingMethod} · 화면 ${settings.width}×${settings.height} · ${runs.length}회`,
    ...(settings.cookie ? [`- 쿠키: \`${settings.cookie}\``] : []),
    ...(settings.hostUserAgent ? [`- 측정 브라우저: ${settings.hostUserAgent} · 기기 성능 지수(benchmarkIndex) ${settings.benchmarkIndex ?? "-"}`] : []),
    `- 대표 회차 LCP 요소: \`${runs[representative]?.lcpElement ?? "-"}\``,
    "",
    header,
    divider,
    ...rows,
    medianRow,
    "",
  ].join("\n");
}
