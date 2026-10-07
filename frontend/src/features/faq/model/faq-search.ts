import type { FaqItem } from "@/shared/static/faq";

/** 검색어 정규화: 앞뒤 공백 제거 + 소문자화. */
export function normalizeFaqQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * FAQ 항목을 검색어로 필터링한다.
 * - 질문(q)과 답변(a) 모두를 대상으로 대소문자 무시 부분일치.
 * - 빈 검색어면 원본 순서 그대로 전부 반환한다.
 */
export function filterFaqItems(
  items: readonly FaqItem[],
  query: string,
): FaqItem[] {
  const q = normalizeFaqQuery(query);
  if (q === "") {
    return [...items];
  }
  return items.filter(
    (item) =>
      item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q),
  );
}
