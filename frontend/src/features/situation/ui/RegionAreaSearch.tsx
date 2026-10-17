"use client";

import { ChevronDownIcon, SearchField, cn } from "@/shared/ui";
import { situationStatic } from "@/shared/static/situation";
import styles from "./css/RegionAreaSearch.module.css";
import { useRegionDropdown } from "../hooks/useRegionDropdown";
import {
  isEditingRegionQuery,
  splitRegionHighlight,
  type RegionResultsState,
} from "../model/region-dropdown";
import type {
  PopularRegionKeyword,
  RegionResultRow,
} from "../model/types";

export interface RegionAreaSearchProps {
  /** 동네 칸 글자(제어). 고른 동 이름이면서 검색어다. */
  query: string;
  onQueryChange: (value: string) => void;
  /** 목록 상단 캡션(예: "종로구 동네 8곳", "검색 결과 3곳"). */
  caption?: string;
  popularKeywords: readonly PopularRegionKeyword[];
  onPopularKeywordSelect: (keyword: PopularRegionKeyword) => void;
  /** 드롭다운에 보여줄 동네 행. */
  results: readonly RegionResultRow[];
  /** 드롭다운 본문 상태(구 목록 · 검색 결과 · 안내 · 결과 없음). */
  resultsState: RegionResultsState;
  /** 결과 행에서 강조할 검색어. */
  highlightQuery: string;
  /** 선택된 세부 지역 id. */
  selectedId?: string;
  /** 선택된 동 이름. 칸 글자가 이와 다르면 "고치는 중"으로 본다. */
  selectedLabel?: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * region-area-search : 동네 검색형 드롭다운 (features/situation 조각, QA #2 · issue #208).
 *
 * 칸을 누르면 드롭다운이 열리고, 맨 위 인기 검색어 아래로 구 동네 전체 / 검색 결과 / 안내를 보여준다.
 * 칸에 입력하면 같은 드롭다운 안에서 좁혀진다. 동네 · 인기 검색어를 고르면 접히고,
 * ▾ · 칸 다시 누르기 · 바깥 누르기 · Esc 로 고르지 않고도 접을 수 있다.
 * 패널은 칸 아래 흐름 안에 펼쳐 본문 스크롤 하나로 길어진 목록도 볼 수 있다.
 */
export function RegionAreaSearch({
  query,
  onQueryChange,
  caption,
  popularKeywords,
  onPopularKeywordSelect,
  results,
  resultsState,
  highlightQuery,
  selectedId,
  selectedLabel,
  onSelect,
  className,
}: RegionAreaSearchProps) {
  // 문구는 shared/static 에서 바인딩만 한다(issue #229).
  const copy = situationStatic.region.search;
  const {
    open,
    panelId,
    containerRef,
    show,
    close,
    toggle,
    onFieldClick,
    onInputKeyDown,
    onContainerKeyDown,
    onContainerBlur,
  } = useRegionDropdown({ editing: isEditingRegionQuery(query, selectedLabel) });

  return (
    <div
      ref={containerRef}
      className={cn(styles.wrap, className)}
      onKeyDown={onContainerKeyDown}
      onBlur={onContainerBlur}
    >
      <SearchField
        value={query}
        onChange={(value) => {
          onQueryChange(value);
          show();
        }}
        placeholder={copy.placeholder}
        ariaLabel={copy.ariaLabel}
        className={cn(open && styles.fieldOpen)}
        inputProps={{
          onClick: onFieldClick,
          onKeyDown: onInputKeyDown,
          autoComplete: "off",
        }}
        trailing={
          <button
            type="button"
            aria-label={open ? copy.collapseLabel : copy.expandLabel}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={toggle}
            className={styles.chevronButton}
          >
            <ChevronDownIcon
              size={18}
              className={cn(styles.chevron, open && styles.chevronOpen)}
            />
          </button>
        }
      />

      {open ? (
        <div id={panelId} role="region" aria-label={copy.panelLabel} className={styles.panel}>
          {popularKeywords.length > 0 ? (
            <div className={styles.popular}>
              <p className={styles.panelLabel}>{copy.popularLabel}</p>
              <div className={styles.popularChips}>
                {popularKeywords.map((keyword) => (
                  <button
                    key={keyword.id}
                    type="button"
                    onClick={() => {
                      onPopularKeywordSelect(keyword);
                      close();
                    }}
                    className={styles.popularChip}
                  >
                    {keyword.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {resultsState === "list" || resultsState === "search" ? (
            <>
              {caption && <p className={styles.panelLabel}>{caption}</p>}
              <div role="radiogroup" aria-label={copy.listLabel} className={styles.list}>
                {results.map((row) => {
                  const active = row.id === selectedId;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        onSelect(row.id);
                        close();
                      }}
                      className={cn(styles.row, active && styles.rowActive)}
                    >
                      <span className={styles.name}>
                        {splitRegionHighlight(row.label, highlightQuery).map((part, index) =>
                          part.match ? (
                            <mark key={index} className={styles.match}>
                              {part.text}
                            </mark>
                          ) : (
                            <span key={index}>{part.text}</span>
                          ),
                        )}
                      </span>
                      {row.regionLabel && (
                        <span className={styles.region}>{row.regionLabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : resultsState === "hint" ? (
            <p className={styles.empty} aria-live="polite">
              {copy.hintLines[0]}
              <br />
              {copy.hintLines[1]}
            </p>
          ) : (
            // 검색했지만 결과 없음: 구 재선택/재입력 안내.
            <p className={styles.empty} aria-live="polite">
              {copy.emptyLines[0]}
              <br />
              {copy.emptyLines[1]}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
