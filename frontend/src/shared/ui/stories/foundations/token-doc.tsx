import type { ReactNode } from "react";

/** 토큰의 현재 계산값. 스토리북은 브라우저에서만 그려서 렌더 중에 읽어도 된다. */
export function readToken(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function TokenPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6 text-text-strong">
      <header className="flex flex-col gap-1">
        <h1 className="text-title font-bold">{title}</h1>
        <p className="text-label text-text-muted">{description}</p>
      </header>
      {children}
    </div>
  );
}

export function TokenSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-body font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function TokenName({ name, utility }: { name: string; utility?: string }) {
  return (
    <span className="flex flex-col">
      <code className="text-meta font-semibold">{name}</code>
      {utility ? <code className="text-caption text-text-muted">{utility}</code> : null}
    </span>
  );
}
