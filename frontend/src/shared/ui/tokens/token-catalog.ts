/**
 * 디자인 토큰 목록 (issue #227).
 * 값의 원본은 `app/globals.css` 이고, 여기는 이름 · 쓰임만 둔다(스토리북 Foundations 문서용).
 * 토큰을 추가 · 삭제하면 이 목록도 함께 고친다 — `token-catalog.test.ts` 가 globals.css 와 맞는지 검사한다.
 */

export interface TokenEntry {
  /** CSS 변수 이름 (`--` 포함). */
  name: string;
  /** 쓰임. */
  usage: string;
}

export interface TokenGroup {
  title: string;
  tokens: TokenEntry[];
}

export const COLOR_GROUPS: TokenGroup[] = [
  {
    title: "Brand",
    tokens: [
      { name: "--color-primary", usage: "주 버튼 · 선택 · 강조" },
      { name: "--color-primary-weak", usage: "주 버튼 hover" },
      { name: "--color-primary-pressed", usage: "주 버튼 누름" },
      { name: "--color-primary-surface", usage: "옅은 보라 면" },
      { name: "--color-on-primary", usage: "채운 면 위 글자 · 아이콘" },
      { name: "--color-primary-gradient-end", usage: "브랜드 그라데이션 끝색" },
      { name: "--color-primary-tint", usage: "연보라 칩 바탕" },
      { name: "--color-primary-deep", usage: "연보라 칩 글자" },
    ],
  },
  {
    title: "Text",
    tokens: [
      { name: "--color-text-strong", usage: "제목 · 본문" },
      { name: "--color-text", usage: "기본 글자" },
      { name: "--color-text-secondary", usage: "부제목" },
      { name: "--color-text-tertiary", usage: "보조 글자" },
      { name: "--color-text-muted", usage: "설명 · 메타" },
      { name: "--color-text-subtle", usage: "시작 · 온보딩 설명" },
      { name: "--color-text-disabled", usage: "비활성" },
    ],
  },
  {
    title: "Surface & Border",
    tokens: [
      { name: "--color-surface", usage: "카드 · 시트 바탕" },
      { name: "--color-surface-subtle", usage: "옅은 회색 면" },
      { name: "--color-surface-muted", usage: "온보딩 그림 카드 바탕" },
      { name: "--color-surface-chip", usage: "회색 보조 버튼" },
      { name: "--color-frame", usage: "앱 좌우 여백" },
      { name: "--color-border", usage: "기본 테두리" },
      { name: "--color-border-strong", usage: "진한 테두리" },
      { name: "--color-border-soft", usage: "그림 카드 안 흰 카드 테두리" },
      { name: "--color-indicator-idle", usage: "진행 점(현재 아님)" },
    ],
  },
  {
    title: "Status & Feedback",
    tokens: [
      { name: "--color-success", usage: "성공 문구" },
      { name: "--color-danger", usage: "검증 · 에러 문구" },
      { name: "--color-danger-surface", usage: "에러 박스 바탕" },
      { name: "--color-danger-border", usage: "에러 박스 테두리" },
      { name: "--color-danger-strong", usage: "에러 박스 글자" },
      { name: "--color-toast-bg", usage: "토스트 바탕" },
      { name: "--color-overlay", usage: "바텀시트 · 사이드메뉴 딤" },
      { name: "--color-overlay-strong", usage: "확인 모달 딤" },
    ],
  },
  {
    title: "Transport",
    tokens: [
      { name: "--color-transport-start", usage: "출발" },
      { name: "--color-transport-walk", usage: "도보" },
      { name: "--color-transport-subway", usage: "지하철" },
      { name: "--color-transport-subway-alt", usage: "지하철(보조)" },
      { name: "--color-transport-bus", usage: "버스" },
      { name: "--color-transport-car", usage: "자동차" },
      { name: "--color-transport-arrive", usage: "도착" },
    ],
  },
  {
    title: "Purpose",
    tokens: [
      { name: "--color-purpose-date", usage: "데이트" },
      { name: "--color-purpose-blind", usage: "소개팅" },
      { name: "--color-purpose-friends", usage: "친구" },
      { name: "--color-purpose-anniversary", usage: "기념일" },
    ],
  },
];

/** 원본 팔레트 램프. 화면 코드는 의미 토큰을 쓰고, 램프는 의미 토큰 정의에만 쓴다. */
export const PALETTE_RAMPS: { title: string; prefix: string; steps: number[] }[] = [
  { title: "Primary", prefix: "--color-primary-", steps: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] },
  { title: "Neutral", prefix: "--color-neutral-", steps: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] },
  { title: "Orange", prefix: "--color-orange-", steps: [100, 200, 300, 400, 500, 600] },
  { title: "Teal", prefix: "--color-teal-", steps: [100, 200, 300, 400, 500, 600] },
];

export const TYPE_SCALE: (TokenEntry & { utility: string })[] = [
  { name: "--text-micro", utility: "text-micro", usage: "보조 숫자 · 뱃지" },
  { name: "--text-caption", utility: "text-caption", usage: "캡션 · 메타" },
  { name: "--text-meta", utility: "text-meta", usage: "보조 정보" },
  { name: "--text-label", utility: "text-label", usage: "라벨 · 설명" },
  { name: "--text-control", utility: "text-control", usage: "입력칸 · 작은 버튼" },
  { name: "--text-body", utility: "text-body", usage: "본문 · 항목 제목" },
  { name: "--text-body-lg", utility: "text-body-lg", usage: "시트 제목 · 폼 라벨" },
  { name: "--text-title-sm", utility: "text-title-sm", usage: "작은 제목" },
  { name: "--text-title", utility: "text-title", usage: "화면 제목(내비 바)" },
  { name: "--text-headline", utility: "text-headline", usage: "큰 숫자 · 아바타 이니셜 · 시작 화면 문구" },
  { name: "--text-display", utility: "text-display", usage: "온보딩 제목" },
];

export const RADIUS_SCALE: (TokenEntry & { utility: string })[] = [
  { name: "--radius-xs", utility: "rounded-xs", usage: "작은 칩" },
  { name: "--radius-sm", utility: "rounded-sm", usage: "작은 버튼" },
  { name: "--radius-base", utility: "rounded-base", usage: "목록 행 · 사진 · 입력칸" },
  { name: "--radius-md", utility: "rounded-md", usage: "선택 목록 · 입력" },
  { name: "--radius-card", utility: "rounded-card", usage: "패널 · 안내 박스 · 큰 버튼" },
  { name: "--radius-lg", utility: "rounded-lg", usage: "카드" },
  { name: "--radius-tile", utility: "rounded-tile", usage: "온보딩 장소 카드" },
  { name: "--radius-xl", utility: "rounded-xl", usage: "큰 카드 · 모달" },
  { name: "--radius-sheet", utility: "rounded-sheet", usage: "바텀시트 윗모서리" },
  { name: "--radius-pill", utility: "rounded-pill", usage: "알약 · 원형" },
];

export const SHADOW_SCALE: (TokenEntry & { utility: string })[] = [
  { name: "--shadow-card", utility: "shadow-card", usage: "장소 카드" },
  { name: "--shadow-card-active", utility: "shadow-card-active", usage: "끌어 옮기는 카드" },
  { name: "--shadow-badge", utility: "shadow-badge", usage: "번호 뱃지" },
  { name: "--shadow-popover", utility: "shadow-popover", usage: "드롭다운 목록" },
  { name: "--shadow-marker", utility: "shadow-marker", usage: "지도 마커" },
  { name: "--shadow-brand", utility: "shadow-brand", usage: "브랜드 그라데이션 강조 칸" },
];

export const MOTION_TOKENS: TokenEntry[] = [
  { name: "--duration-press", usage: "누름 피드백" },
  { name: "--duration-fast", usage: "색 · 테두리 전환" },
  { name: "--duration-base", usage: "열고 닫기 · 회전" },
  { name: "--duration-slow", usage: "시트 · 패널 이동" },
  { name: "--ease-sheet", usage: "바텀시트 올라옴" },
  { name: "--duration-slide", usage: "온보딩 장 넘김" },
  { name: "--ease-slide", usage: "온보딩 장 넘김" },
  { name: "--duration-rise", usage: "시작 화면 등장" },
];

export const LAYER_TOKENS: TokenEntry[] = [
  { name: "--z-raised", usage: "같은 목록 안에서 위로" },
  { name: "--z-dropdown", usage: "선택 목록" },
  { name: "--z-sheet", usage: "바텀시트" },
  { name: "--z-modal", usage: "확인 모달 · 사이드메뉴" },
  { name: "--z-toast", usage: "토스트 (모달 위)" },
];

/** 목록에 있는 모든 토큰 이름. */
export function allCatalogTokenNames(): string[] {
  return [
    ...COLOR_GROUPS.flatMap((group) => group.tokens.map((token) => token.name)),
    ...PALETTE_RAMPS.flatMap((ramp) => ramp.steps.map((step) => `${ramp.prefix}${step}`)),
    ...TYPE_SCALE.map((token) => token.name),
    ...RADIUS_SCALE.map((token) => token.name),
    ...SHADOW_SCALE.map((token) => token.name),
    ...MOTION_TOKENS.map((token) => token.name),
    ...LAYER_TOKENS.map((token) => token.name),
  ];
}
