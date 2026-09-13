"use client";

import { cn } from "../lib";
import { PlaceNumberBadge } from "../badge";
import { StarIcon } from "../icon";

export interface SelectablePlaceCardProps {
  /** 장소명(카드 제목). */
  name: string;
  /** 카테고리(예: 고궁, 시장). */
  category?: string;
  /** 지역(district, 예: 종로구). */
  region?: string;
  /** 선택 순번(1-based). 선택된 경우에만 뱃지로 노출한다. */
  order?: number;
  /** 평점(0~5). null/undefined 면(평점 없는 장소) 표시하지 않는다. */
  rating?: number | null;
  /** 선택 여부. primary 스타일 + aria-pressed 로 전달. */
  selected?: boolean;
  /** 비활성(최대 선택 도달 시 미선택 카드). 선택된 카드는 비활성화하지 않는다. */
  disabled?: boolean;
  /** 카드 탭 콜백(선택/해제 토글은 상위에서 결정). */
  onToggle?: () => void;
  className?: string;
}

/**
 * card-place-selectable : 순서 선택형 장소 카드 (도메인 없는 공용 프레젠테이션 UI).
 *
 * 시안(HTML) 기준의 세로 카드(2열 그리드 셀)다. 순번 뱃지는 우측 상단에 겹쳐 놓고,
 * 이름·메타·평점을 세로로 쌓는다. 탭하면 순서를 매기는 토글 버튼이며 선택/순서 규칙은
 * 담지 않고 `selected`/`order`/`disabled`/`onToggle` 로 상위(도메인 훅)가 주입한다.
 *   - selected 상태는 `aria-pressed` 로, 순번은 뱃지 + sr-only 텍스트로 함께 전달한다(색상 의존 금지).
 */
export function SelectablePlaceCard({
  name,
  category,
  region,
  order,
  rating,
  selected = false,
  disabled = false,
  onToggle,
  className,
}: SelectablePlaceCardProps) {
  const meta = [category, region].filter(Boolean).join(" · ");
  // 스크린리더에 선택 상태/순번을 텍스트로도 전달한다.
  const statusText = selected
    ? `선택됨, ${order}번째 방문`
    : disabled
      ? "선택할 수 없음"
      : "선택 안 됨";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        "relative flex h-full w-full flex-col rounded-[14px] border-2 px-2.5 py-2.5 text-left transition-colors sm:px-3 sm:py-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected
          ? "border-primary bg-primary-surface"
          : "border-border bg-surface-subtle hover:border-border-strong",
        disabled && "opacity-40",
        className,
      )}
    >
      {/* 순번 뱃지: 우측 상단 겹침. 선택 시에만 숫자 표시. */}
      {selected && order != null ? (
        <PlaceNumberBadge
          value={order}
          size="md"
          className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5"
        />
      ) : (
        <span
          aria-hidden
          className="absolute right-2 top-2 size-5 rounded-full border-[1.5px] border-border-strong bg-surface sm:right-2.5 sm:top-2.5 sm:size-6"
        />
      )}

      {/* 이름 + 메타 (우측 뱃지와 겹치지 않게 pr 확보) */}
      <span className="block min-w-0 pr-6 sm:pr-7">
        <span
          className={cn(
            "block truncate text-[14px] font-bold sm:text-[15px]",
            selected ? "text-primary" : "text-text-strong",
          )}
        >
          {name}
        </span>
        {meta && (
          <span className="mt-0.5 block truncate text-[11px] text-text-muted sm:text-xs">
            {meta}
          </span>
        )}
      </span>

      {/* 평점(있을 때만). 세로 카드라 이름/메타 아래에 배치. */}
      {rating != null && (
        <span className="mt-1.5 flex items-center gap-0.5 text-[12px] font-semibold text-text-secondary sm:mt-2 sm:text-[13px]">
          <span aria-hidden style={{ color: "var(--color-orange-400)" }}>
            <StarIcon size={12} />
          </span>
          <span className="sr-only">평점 </span>
          {rating.toFixed(1)}
          <span className="sr-only">점</span>
        </span>
      )}

      <span className="sr-only">{statusText}</span>
    </button>
  );
}
