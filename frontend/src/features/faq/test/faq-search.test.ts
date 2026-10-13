import { describe, expect, it } from "vitest";

import type { FaqItem } from "@/shared/static/faq";

import { filterFaqItems, normalizeFaqQuery } from "../model/faq-search";

const items: readonly FaqItem[] = [
  {
    q: "Q. 데이로는 어떤 서비스인가요?",
    a: "AI가 상황에 맞는 데이트 코스를 추천해드려요.",
  },
  {
    q: "Q. 코스 생성은 무료인가요?",
    a: "데이트 코스 생성과 조회는 모두 무료예요.",
  },
  {
    q: "Q. 로그인이 필요한가요?",
    a: "저장할 때만 LOGIN이 필요해요.",
  },
];

describe("filterFaqItems", () => {
  it.each(["", "   "])(
    "빈 검색어(%j)면 원본 순서대로 모든 항목을 반환한다",
    (query) => {
      expect(filterFaqItems(items, query)).toEqual(items);
    },
  );

  it("질문의 일부와 일치하는 항목을 반환한다", () => {
    expect(filterFaqItems(items, "코스 생성")).toEqual([items[1]]);
  });

  it("답변의 일부와 일치하는 항목을 반환한다", () => {
    expect(filterFaqItems(items, "상황에 맞는")).toEqual([items[0]]);
  });

  it("영문 대소문자를 무시하고 일치시킨다", () => {
    expect(filterFaqItems(items, "login")).toEqual([items[2]]);
  });

  it("검색어의 앞뒤 공백을 제거한 뒤 일치시킨다", () => {
    expect(filterFaqItems(items, "  무료인가요  ")).toEqual([items[1]]);
  });

  it("일치하는 항목이 없으면 빈 배열을 반환한다", () => {
    expect(filterFaqItems(items, "결제 수단")).toEqual([]);
  });

  it.each(["", "코스"])(
    "검색어 %j 처리 시 원본 배열을 변형하지 않고 새 배열을 반환한다",
    (query) => {
      const originalItems = [...items];

      const result = filterFaqItems(items, query);

      expect(items).toEqual(originalItems);
      expect(result).not.toBe(items);
    },
  );
});

describe("normalizeFaqQuery", () => {
  it("검색어의 앞뒤 공백을 제거하고 소문자로 변환한다", () => {
    expect(normalizeFaqQuery("  LoGiN  ")).toBe("login");
  });
});
