"use client";

import { cn } from "@/shared/ui";
import type { FaqItem } from "@/shared/static/faq";
import { useFaqAccordion } from "../hooks/useFaqAccordion";
import styles from "./css/FaqAccordion.module.css";

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
  const { isOpen, toggleItem } = useFaqAccordion();

  return (
    <ul>
      {items.map((item, index) => {
        const open = isOpen(item.q);
        const questionId = `faq-question-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <li key={item.q} className={styles.item}>
            <h2>
              <button
                type="button"
                id={questionId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggleItem(item.q)}
                className={`${styles.questionButton} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:opacity-60`}
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
                    styles.chevron,
                    open && styles.chevronOpen,
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
                styles.panel,
                open ? styles.panelOpen : styles.panelClosed,
              )}
            >
              <div className={styles.panelInner}>
                <p className={`${styles.answer} text-[13px] leading-relaxed text-text-muted`}>
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
