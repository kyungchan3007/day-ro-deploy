/**
 * 디자인 토큰 우회 검사 규칙 (issue #227).
 * 화면 코드(tsx · ts · css module)가 `globals.css` 토큰 대신 값을 직접 쓰는지 찾는다.
 * 규칙 · 예외는 이 파일 한 곳에서 관리하고, `design-token-guard.test.ts` 가 src 전체에 돌린다.
 */

export interface TokenRule {
  id: string;
  /** 어느 파일 종류에 적용할지. script = tsx · ts. */
  appliesTo: "script" | "css" | "all";
  pattern: RegExp;
  /** 대신 쓸 토큰 안내. */
  hint: string;
}

const HEX = "#[0-9a-fA-F]{3,8}\\b";

export const TOKEN_RULES: TokenRule[] = [
  {
    id: "arbitrary-font-size",
    appliesTo: "script",
    pattern: /\btext-\[[0-9.]+(px|rem)\]/,
    hint: "글자 크기 단계 text-micro~headline 을 쓴다",
  },
  {
    id: "raw-font-size",
    appliesTo: "css",
    pattern: /(?<![\w-])font-size\s*:[^;]*\b[0-9.]+(px|rem)\b/,
    hint: "font-size: var(--text-*) 를 쓴다",
  },
  {
    id: "raw-hex-color",
    appliesTo: "css",
    pattern: new RegExp(`:[^;]*${HEX}`),
    hint: "--color-* 의미 토큰을 쓴다",
  },
  {
    id: "raw-hex-color",
    appliesTo: "script",
    // 앵커 링크(href="#abc")는 빼고, 색 문자열 · 임의 class · 인라인 스타일 문자열의 hex 를 찾는다.
    pattern: new RegExp(`((?<!href\\s*=\\s*)["'\`]${HEX}["'\`]|-\\[${HEX}\\]|:\\s*${HEX})`),
    hint: "--color-* 의미 토큰을 쓴다",
  },
  {
    id: "raw-named-color",
    appliesTo: "css",
    pattern: /:\s*[^;]*\b(white|black)\b/,
    hint: "--color-on-primary · --color-surface 같은 의미 토큰을 쓴다",
  },
  {
    id: "raw-rgb-color",
    appliesTo: "all",
    pattern: /\brgba?\(\s*[0-9]/,
    hint: "--color-* · --shadow-* 토큰을 쓴다",
  },
  {
    id: "raw-palette-class",
    appliesTo: "script",
    pattern:
      /\b(bg|text|border|ring|fill|stroke|from|to|via|outline|divide|placeholder|decoration)-(white|black|gray|slate|zinc|neutral-[0-9]|red|green|blue|yellow|purple|violet|pink|amber|emerald|rose|indigo|sky|stone)\b/,
    hint: "on-primary · overlay · danger-* 같은 의미 토큰을 쓴다",
  },
  {
    id: "arbitrary-radius",
    appliesTo: "script",
    pattern: /\brounded(-(t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?-\[[0-9.]+(px|rem)\]/,
    hint: "rounded-xs~xl · rounded-base · rounded-card · rounded-sheet 를 쓴다",
  },
  {
    id: "raw-radius",
    appliesTo: "css",
    pattern: /(?<![\w-])border-([a-z]+-)*radius\s*:[^;]*\b[0-9.]+(px|rem)\b/,
    hint: "border-radius: var(--radius-*) 를 쓴다",
  },
  {
    id: "raw-z-index",
    appliesTo: "css",
    pattern: /(?<![\w-])z-index\s*:\s*-?[0-9]+/,
    hint: "z-index: var(--z-*) 를 쓴다",
  },
  {
    id: "raw-z-class",
    appliesTo: "script",
    // z-0 ~ z-29 는 컴포넌트 안 쌓임 순서로 허용. 화면 레이어(30 이상)와 임의값은 토큰으로.
    pattern: /\bz-(\[-?[0-9]+\]|[3-9][0-9]|[1-9][0-9]{2,})(?![\w-])/,
    hint: "z-(--z-dropdown · sheet · modal · toast) 를 쓴다",
  },
  {
    id: "default-font-size-class",
    appliesTo: "script",
    // Tailwind 기본 글자 크기는 행간까지 바꿔 Dayro 단계와 섞이면 기준이 흐려진다(issue #229).
    pattern: /(?<![\w:-])(?:[\w-]+:)*!?text-(xs|sm|base|lg|xl|[2-9]xl)(?:\/[\w.[\]-]+)?(?![\w-])/,
    hint: "text-meta · control · body-lg · title · title-lg · display (+ 필요하면 leading-*) 를 쓴다",
  },
  {
    id: "raw-duration-class",
    appliesTo: "script",
    pattern: /(?<![\w:-])(?:[\w-]+:)*!?(duration|delay)-(?:[0-9]+|\[[0-9.]+m?s\])(?![\w-])/,
    hint: "duration-(--duration-*) · delay-(--delay-stagger) 를 쓴다",
  },
  {
    id: "raw-duration",
    appliesTo: "css",
    pattern: /(?<![\w-])(transition|animation)(-duration|-delay)?\s*:[^;]*?(?<![\w.-])[0-9]*\.?[0-9]+m?s\b/,
    hint: "var(--duration-*) · var(--delay-stagger) 를 쓴다",
  },
  {
    id: "raw-app-width",
    appliesTo: "all",
    // 미디어 조건 `(max-width: 640px)` (이미지 sizes · @media)은 변수를 못 써서 뺀다.
    pattern: /max-w-\[640px\]|(?<!\(\s*)(?<![\w-])max-width\s*:\s*640px/,
    hint: "max-w-app · var(--container-app) 를 쓴다",
  },
  {
    id: "raw-inline-style",
    appliesTo: "script",
    pattern: /\b(fontSize|borderRadius|zIndex|boxShadow)\s*:\s*["'`]?-?[0-9]/,
    hint: "인라인 스타일도 var(--*) 토큰을 쓴다",
  },
];

/**
 * 예외 파일과 이유. 경로는 src 기준.
 * `rules` 를 주면 그 규칙만 빼고, 없으면 파일 전체를 뺀다.
 * 외부 브랜드 규정 · SVG 속성처럼 CSS 변수를 쓸 수 없는 곳만 둔다.
 */
export const TOKEN_GUARD_ALLOWLIST: Record<string, { reason: string; rules?: string[] }> = {
  "app/globals.css": { reason: "토큰 정의 원본" },
  "app/ui-preview/colors/page.tsx": { reason: "토큰 값 확인용 견본 페이지(hex 라벨 표시)" },
  "features/auth/ui/KakaoLoginButton.tsx": {
    reason: "카카오 디자인 가이드 고정 색(#FEE500 · 검정 85%) — 데이로 토큰에 넣지 않는다",
    rules: ["raw-hex-color", "raw-rgb-color"],
  },
  "shared/ui/logo/Logo.tsx": { reason: "로고 SVG 원본 색", rules: ["raw-hex-color"] },
  "features/course-map/hooks/useKakaoMap.ts": {
    reason: "지도 경로선은 SDK 가 SVG 속성으로 그려 CSS 변수를 못 읽고, 마커 zIndex 는 SDK 옵션(숫자)이다",
    rules: ["raw-hex-color", "raw-inline-style"],
  },
};

/** 검사 대상 경로인지. 테스트 · 스토리 · e2e · 이미지 자원 · 파일 전체 예외는 뺀다. */
export function isGuardTarget(relativePath: string): boolean {
  if (!/\.(tsx|ts|css)$/.test(relativePath)) return false;
  if (/\.(test|spec|stories)\.(tsx|ts)$/.test(relativePath)) return false;
  if (relativePath.endsWith(".d.ts")) return false;
  if (/(^|\/)(e2e|e2e-video|e2e-vr|assets)\//.test(relativePath)) return false;
  if (relativePath.startsWith("shared/ui/tokens/")) return false;
  const allow = TOKEN_GUARD_ALLOWLIST[relativePath];
  return !(allow && !allow.rules);
}

export interface TokenViolation {
  file: string;
  line: number;
  rule: string;
  hint: string;
  text: string;
}

/**
 * 주석을 빈칸으로 바꾼다(줄 번호 · 열 위치 유지). 문자열 · 템플릿 안의 `//` · `/*` 는 주석이 아니다.
 * 주석 속 예시(`text-[13px]` 를 바꾼다 등)를 위반으로 잡지 않기 위함.
 * 따옴표 문자열은 줄을 넘지 않으므로 줄바꿈에서 상태를 되돌린다 → JSX 글자 속 따옴표(It's)가 다음 줄로 번지지 않는다.
 */
export function stripComments(source: string, isCss: boolean): string {
  type State = "code" | "single" | "double" | "template" | "line" | "block";
  let state: State = "code";
  let out = "";
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === "\n") {
      if (state === "line" || state === "single" || state === "double") state = "code";
      out += ch;
      continue;
    }
    switch (state) {
      case "block":
        if (ch === "*" && next === "/") {
          out += "  ";
          i += 1;
          state = "code";
        } else {
          out += " ";
        }
        continue;
      case "line":
        out += " ";
        continue;
      case "single":
      case "double":
      case "template": {
        out += ch;
        if (ch === "\\") {
          out += next ?? "";
          i += 1;
        } else if (
          (state === "single" && ch === "'") ||
          (state === "double" && ch === '"') ||
          (state === "template" && ch === "`")
        ) {
          state = "code";
        }
        continue;
      }
      default:
        if (ch === "/" && next === "*") {
          out += "  ";
          i += 1;
          state = "block";
        } else if (!isCss && ch === "/" && next === "/") {
          out += "  ";
          i += 1;
          state = "line";
        } else {
          if (ch === "'") state = isCss ? "code" : "single";
          else if (ch === '"') state = "double";
          else if (ch === "`" && !isCss) state = "template";
          out += ch;
        }
    }
  }
  return out;
}

/** 검사 단위 조각과 시작 줄 번호. */
interface Chunk {
  line: number;
  text: string;
}

/**
 * CSS 는 선언(`;` · `{` · `}` 사이) 단위로 자른다 → 여러 줄로 쓴 선언도 속성과 값을 함께 본다(issue #229).
 * 스크립트는 줄 단위(클래스 문자열은 줄을 넘지 않게 쓴다).
 */
function toChunks(stripped: string, isCss: boolean): Chunk[] {
  if (!isCss) return stripped.split("\n").map((text, index) => ({ line: index + 1, text }));
  const chunks: Chunk[] = [];
  const pattern = /[^;{}]+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(stripped)) !== null) {
    const lead = match[0].length - match[0].trimStart().length;
    if (match[0].trim() === "") continue;
    const line = stripped.slice(0, match.index + lead).split("\n").length;
    chunks.push({ line, text: match[0].replace(/\s+/g, " ").trim() });
  }
  return chunks;
}

/** 파일 한 개의 위반 목록. tsx · ts 는 script 규칙, css 는 css 규칙, 둘 다 all 규칙. */
export function findTokenViolations(file: string, source: string): TokenViolation[] {
  const isCss = file.endsWith(".css");
  const skipped = new Set(TOKEN_GUARD_ALLOWLIST[file]?.rules ?? []);
  const rules = TOKEN_RULES.filter(
    (rule) =>
      (rule.appliesTo === "all" || rule.appliesTo === (isCss ? "css" : "script")) && !skipped.has(rule.id),
  );
  const original = source.split("\n");
  const violations: TokenViolation[] = [];
  for (const chunk of toChunks(stripComments(source, isCss), isCss)) {
    const seen = new Set<string>();
    for (const rule of rules) {
      if (!seen.has(rule.id) && rule.pattern.test(chunk.text)) {
        seen.add(rule.id);
        violations.push({ file, line: chunk.line, rule: rule.id, hint: rule.hint, text: original[chunk.line - 1].trim() });
      }
    }
  }
  return violations;
}
