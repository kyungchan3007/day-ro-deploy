"use client";

import { useState } from "react";
import { cn } from "@/shared/ui";
import type { FaqItem } from "@/shared/static/faq";

export interface FaqAccordionProps {
  items: readonly FaqItem[];
}

/**
 * FAQ 아코디언 (features/faq 조각).
 *
 * 시안(데이로라_홈)의 아코디언과 동일하게, 한 번에 하나의 문항만 펼쳐진다.
 *   - 각 질문은 h2 로 감싼 토글 버튼(aria-expanded/controls) + 회전 chevron.
 *   - 답변 패널은 grid-rows 0fr↔1fr 트랜지션으로 접힘/펼침(텍스트 확대 시에도 잘리지 않음).
 *   - APG 아코디언 기준상 패널 수가 6개를 넘어 region 랜드마크 남발을 피하려 role 은 두지 않는다.
 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ul>
      {items.map((item, index) => {
        const open = openIndex === index;
        const questionId = `faq-question-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <li key={item.q} className="border-b border-border">
            <h2>
              <button
                type="button"
                id={questionId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-2.5 rounded px-1 py-4 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:opacity-60"
              >
                <span className="text-[14.5px] font-semibold text-text-strong">
                  {item.q}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                  className={cn(
                    "shrink-0 text-neutral-300 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </h2>

            <div
              id={panelId}
              className={cn(
                "grid transition-[grid-template-rows] duration-[250ms] ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-1 pb-[18px] text-[13px] leading-relaxed text-text-muted">
                  {item.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
