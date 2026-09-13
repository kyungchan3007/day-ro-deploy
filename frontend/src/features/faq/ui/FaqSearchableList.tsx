"use client";

import { useState } from "react";

import type { FaqItem } from "@/shared/static/faq";

import { filterFaqItems } from "../model/faq-search";
import { FaqAccordion } from "./FaqAccordion";

export interface FaqSearchableListProps {
  items: readonly FaqItem[];
}

/**
 * 검색 가능한 FAQ 목록 (features/faq 조각).
 *
 * 검색어 상태를 들고 `filterFaqItems`로 걸러 `FaqAccordion`에 넘긴다.
 * 결과가 없으면 빈 상태 안내를 보여준다. (필터 로직은 model, 표시는 아코디언에 위임)
 */
export function FaqSearchableList({ items }: FaqSearchableListProps) {
  const [query, setQuery] = useState("");
  const filtered = filterFaqItems(items, query);
  const trimmed = query.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M11 11l3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="궁금한 내용을 검색하세요"
          aria-label="FAQ 검색"
          className="w-full rounded-xl border border-border bg-surface-subtle py-2.5 pl-9 pr-3 text-[14px] text-text-strong placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>

      {filtered.length > 0 ? (
        <FaqAccordion items={filtered} />
      ) : (
        <p
          role="status"
          className="py-8 text-center text-[13px] leading-relaxed text-text-muted"
        >
          ‘{trimmed}’에 대한 검색 결과가 없어요.
        </p>
      )}
    </div>
  );
}
