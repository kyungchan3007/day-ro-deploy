"use client";

import { useState } from "react";

import type { FaqItem } from "@/shared/static/faq";

import { filterFaqItems } from "../model/faq-search";

/**
 * FAQ 검색 상태 훅 (features/faq).
 * 검색어 state 를 들고 `filterFaqItems`(model) 결과와 빈 결과 안내용 검색어를 돌려준다.
 * @param items 전체 FAQ 항목.
 */
export function useFaqSearch(items: readonly FaqItem[]) {
  const [query, setQuery] = useState("");
  const filtered = filterFaqItems(items, query);

  return {
    query,
    setQuery,
    filtered,
    trimmedQuery: query.trim(),
    hasResults: filtered.length > 0,
  };
}
