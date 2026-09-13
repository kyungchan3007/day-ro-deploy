"use client";

/**
 * 디자인 토큰(색) 시각 확인용 페이지. /ui-preview/colors
 * Tailwind v4 @theme 토큰이 생성한 유틸(bg-*)을 그대로 사용해 렌더 → 토큰 검증도 겸함.
 */

function Swatch({ className, name, hex }: { className: string; name: string; hex?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`h-14 w-full rounded-md border border-border ${className}`}
      />
      <div className="text-[11px] font-medium text-text-strong">{name}</div>
      {hex && <div className="text-[10px] text-text-muted">{hex}</div>}
    </div>
  );
}

function Ramp({
  title,
  items,
}: {
  title: string;
  items: { className: string; name: string; hex: string }[];
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-bold text-text-strong">{title}</h2>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-11">
        {items.map((it) => (
          <Swatch key={it.name} {...it} />
        ))}
      </div>
    </section>
  );
}

const primary = [
  ["bg-primary-100", "100", "#FAF5FF"],
  ["bg-primary-200", "200", "#F4EAFD"],
  ["bg-primary-300", "300", "#DDC2F5"],
  ["bg-primary-400", "400", "#CBA4EF"],
  ["bg-primary-500", "500", "#B37DE6"],
  ["bg-primary-600", "600", "#954ED8"],
  ["bg-primary-700", "700 · Base", "#7800E9"],
  ["bg-primary-800", "800", "#3E0078"],
  ["bg-primary-900", "900", "#250048"],
  ["bg-primary-1000", "1000", "#130026"],
] as const;

const neutral = [
  ["bg-neutral-50", "50", "#F6F6F6"],
  ["bg-neutral-100", "100", "#F0F0F0"],
  ["bg-neutral-200", "200", "#E5E5E5"],
  ["bg-neutral-300", "300", "#C9C9C9"],
  ["bg-neutral-400", "400", "#A8A8A8"],
  ["bg-neutral-500", "500", "#8F8F8F"],
  ["bg-neutral-600", "600", "#797979"],
  ["bg-neutral-700", "700", "#5B5B5B"],
  ["bg-neutral-800", "800", "#383838"],
  ["bg-neutral-900", "900", "#1E1E1E"],
  ["bg-neutral-950", "950", "#111111"],
] as const;

const orange = [
  ["bg-orange-100", "100", "#FFEFE4"],
  ["bg-orange-200", "200", "#FFD5B4"],
  ["bg-orange-300", "300", "#FFAA57"],
  ["bg-orange-400", "400", "#EA8C30"],
  ["bg-orange-500", "500", "#FF6A04"],
  ["bg-orange-600", "600", "#C74C00"],
] as const;

const teal = [
  ["bg-teal-100", "100", "#E9FDFB"],
  ["bg-teal-200", "200", "#BEFAF5"],
  ["bg-teal-300", "300", "#6DEDE2"],
  ["bg-teal-400", "400", "#08EAD8"],
  ["bg-teal-500", "500", "#00B2A4"],
  ["bg-teal-600", "600", "#00978B"],
] as const;

const semantic = [
  ["bg-primary", "primary", "#7800E9"],
  ["bg-primary-weak", "primary-weak", "#954ED8"],
  ["bg-primary-pressed", "primary-pressed", "#3E0078"],
  ["bg-primary-surface", "primary-surface", "#FAF5FF"],
  ["bg-success", "success", "#00B52D"],
  ["bg-surface-subtle", "surface-subtle", "#F6F6F6"],
  ["bg-border", "border", "#E5E5E5"],
  ["bg-border-strong", "border-strong", "#C9C9C9"],
  ["bg-toast-bg", "toast-bg", "#1E1E1E"],
] as const;

const transport = [
  ["bg-transport-start", "start", "#7800E9"],
  ["bg-transport-walk", "walk", "#954ED8"],
  ["bg-transport-subway", "subway", "#00B52D"],
  ["bg-transport-subway-alt", "subway-alt", "#00B2A4"],
  ["bg-transport-bus", "bus", "#EA8C30"],
  ["bg-transport-car", "car", "#2699EC"],
  ["bg-transport-arrive", "arrive", "#3E0078"],
] as const;

const toItems = (rows: readonly (readonly [string, string, string])[]) =>
  rows.map(([className, name, hex]) => ({ className, name, hex }));

export default function ColorsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-xl font-extrabold text-text-strong">Design Tokens · Colors</h1>
        <p className="mt-1 text-sm text-text-muted">
          Figma 컬러 시스템에서 추출한 공식 팔레트 (globals.css @theme)
        </p>
      </header>

      <Ramp title="Primary" items={toItems(primary)} />
      <Ramp title="Neutral" items={toItems(neutral)} />
      <Ramp title="Secondary · Orange" items={toItems(orange)} />
      <Ramp title="Secondary · Teal" items={toItems(teal)} />
      <Ramp title="Semantic" items={toItems(semantic)} />
      <Ramp title="Transport (이동수단)" items={toItems(transport)} />
    </main>
  );
}
