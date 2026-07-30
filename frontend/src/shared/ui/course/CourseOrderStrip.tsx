import { cn } from "../lib";
import { PlaceNumberBadge } from "../badge";

export interface CourseOrderStripItem {
  /** 슬롯 식별자(리스트 key). */
  id: string;
  /** 표시 이름. */
  name: string;
}

export interface CourseOrderStripProps {
  /** 선택된 항목(선택 순서대로). 앞에서부터 슬롯을 채운다. */
  items: readonly CourseOrderStripItem[];
  /** 전체 슬롯 수(최대 선택 개수). */
  max: number;
  /** 빈 슬롯 문구. 기본 "+ 추가". */
  emptyLabel?: string;
  /** 리스트 접근성 라벨. 기본 "선택한 방문 순서". */
  ariaLabel?: string;
  className?: string;
}

/**
 * course-order-strip : 선택 순서 스트립 (도메인 없는 공용 프레젠테이션 UI).
 *
 * `max` 개의 고정 슬롯을 그리고, 채워진 슬롯은 순번 뱃지 + 이름, 빈 슬롯은 emptyLabel 로 표시한다.
 * 순서 계산/선택 규칙은 담지 않으며 `items`(선택 순서대로) 만 받아 렌더한다.
 * 순서를 의미로 전달하기 위해 `<ol>` 로 마크업한다.
 */
export function CourseOrderStrip({
  items,
  max,
  emptyLabel = "+ 추가",
  ariaLabel = "선택한 방문 순서",
  className,
}: CourseOrderStripProps) {
  const slots = Array.from({ length: max }, (_, i) => items[i]);

  return (
    <ol
      aria-label={ariaLabel}
      className={cn("flex gap-2 overflow-x-auto pb-1", className)}
    >
      {slots.map((item, index) => (
        <li
          key={item?.id ?? `empty-${index}`}
          className={cn(
            "flex h-11 min-w-[92px] flex-1 items-center gap-1.5 rounded-xl border px-2.5",
            item
              ? "border-primary bg-primary-surface"
              : "border-dashed border-border-strong bg-surface",
          )}
        >
          {item ? (
            <>
              <PlaceNumberBadge value={index + 1} size="sm" />
              <span className="min-w-0 truncate text-[13px] font-semibold text-text-strong">
                {item.name}
              </span>
            </>
          ) : (
            <span className="w-full text-center text-[13px] text-text-disabled">
              {emptyLabel}
              <span className="sr-only">빈 자리</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
