"use client";

import { SearchField, cn } from "@/shared/ui";
import styles from "./css/RegionAreaSearch.module.css";
import type {
  PopularRegionKeyword,
  RegionResultRow,
} from "../model/types";

export interface RegionAreaSearchProps {
  /** 검색어(제어). 사용자가 동네/지역명을 직접 입력한다. */
  query: string;
  onQueryChange: (value: string) => void;
  /** 결과 상단 캡션(구-스코프일 때 "{구} 동네"). 전역 검색이면 생략. */
  caption?: string;
  popularKeywords: readonly PopularRegionKeyword[];
  showPopularKeywords: boolean;
  onPopularKeywordSelect: (keyword: PopularRegionKeyword) => void;
  /** 검색어로 좁혀진 결과 행. 빈 검색어면 상위에서 빈 배열을 넘긴다. */
  results: readonly RegionResultRow[];
  /** 선택된 세부 지역 id. */
  selectedId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * region-area-search : 동네 검색 입력 + 결과 리스트 (features/situation 조각).
 *
 * 공용 SearchField 로 검색어를 받고, 상위 훅이 계산한 결과 행을 리스트로 보여준다.
 * 검색 전에는 검색 유도 문구를, 검색했지만 결과가 없으면 재선택/재입력 안내를 노출한다.
 * 구-스코프(선택한 구 내부)와 전역(선택 안 함) 검색을 같은 표현으로 처리한다.
 */
export function RegionAreaSearch({
  query,
  onQueryChange,
  caption,
  popularKeywords,
  showPopularKeywords,
  onPopularKeywordSelect,
  results,
  selectedId,
  onSelect,
  className,
}: RegionAreaSearchProps) {
  return (
    <div className={cn(styles.wrap, className)}>
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="가고 싶은 동네를 검색해보세요"
        ariaLabel="동네 검색"
      />

      {showPopularKeywords ? (
        popularKeywords.length > 0 ? (
          <div className={styles.popular}>
            <p className={styles.popularLabel}>인기 검색어</p>
            <div className={styles.popularChips}>
              {popularKeywords.map((keyword) => (
                <button
                  key={keyword.id}
                  type="button"
                  onClick={() => onPopularKeywordSelect(keyword)}
                  className={styles.popularChip}
                >
                  {keyword.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.empty} aria-live="polite">
            가고 싶은 동네를 검색해보세요.
          </p>
        )
      ) : results.length > 0 ? (
        <>
          {caption && <p className={styles.caption}>{caption}</p>}
          <div role="radiogroup" aria-label="동네 선택" className={styles.list}>
            {results.map((row) => {
              const active = row.id === selectedId;
              return (
                <button
                  key={row.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelect(row.id)}
                  className={cn(styles.row, active && styles.rowActive)}
                >
                  <span className={styles.name}>{row.label}</span>
                  {row.regionLabel && (
                    <span className={styles.region}>{row.regionLabel}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        // 검색했지만 결과 없음: 구 재선택/재입력 안내.
        <p className={styles.empty} aria-live="polite">
          찾는 동네가 없어요.
          <br />
          구를 다시 선택하거나 동네를 다시 입력해주세요.
        </p>
      )}
    </div>
  );
}
