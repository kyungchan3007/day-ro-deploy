"use client";

import { cn } from "../lib";
import { PlaceNumberBadge } from "../badge";

export interface SelectablePlaceCardProps {
  /** 장소명(카드 제목). */
  name: string;
  /** 카테고리(예: 고궁, 시장). */
  category?: string;
  /** 지역(district, 예: 종로구). */
  region?: string;
  /** 선택 순번(1-based). 선택된 경우에만 뱃지로 노출한다. */
  order?: number;
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
 * 탭하면 순서를 매기는 토글 버튼이다. 실제 선택/순서 규칙은 담지 않고
 * `selected`/`order`/`disabled`/`onToggle` 로 상위(도메인 훅)가 주입한다.
 *   - selected 상태는 `aria-pressed` 로, 순번은 뱃지 + sr-only 텍스트로 함께 전달한다(색상 의존 금지).
 */
export function SelectablePlaceCard({
  name,
  category,
  region,
  order,
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
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected
          ? "border-primary bg-primary-surface"
          : "border-border bg-surface hover:bg-surface-subtle",
        disabled && "opacity-40",
        className,
      )}
    >
      {selected && order != null ? (
        <PlaceNumberBadge value={order} size="md" />
      ) : (
        <span
          aria-hidden
          className="size-6 shrink-0 rounded-full border border-border-strong"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold text-text-strong">
          {name}
        </span>
        {meta && (
          <span className="mt-0.5 block truncate text-xs text-text-muted">
            {meta}
          </span>
        )}
      </span>
      <span className="sr-only">{statusText}</span>
    </button>
  );
}
