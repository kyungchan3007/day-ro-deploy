import { cn } from "../lib";
import styles from "./css/CourseOrderStrip.module.css";

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
 *
 * 시안(HTML) order-strip 과 동일하게:
 *   - 가로 스크롤(overflow-x, 스크롤바 숨김), 칩은 내용 너비(shrink-0)라 이름이 잘리지 않는다.
 *   - pill 형태, 채워진 칩은 solid primary + 흰 뱃지/글씨, 빈 칩은 흰 배경 + 실선 보더 + 회색 문구.
 *   - 등장 시 chipIn 팝 애니메이션(선택 시 슬롯이 채워지며 pop). reduced-motion 이면 멈춘다.
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
      className={cn(
        // w-full + min-w-0: flex 부모 안에서 스트립이 콘텐츠 너비로 벌어져
        // 페이지 전체가 가로 스크롤되는 것을 막고, 스크롤을 스트립 내부로 가둔다.
        "flex w-full min-w-0 gap-2 overflow-x-auto pb-1",
        styles.strip,
        className,
      )}
    >
      {slots.map((item, index) => (
        <li
          key={item?.id ?? `empty-${index}`}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-pill border px-2.5 sm:h-10",
            styles.chip,
            item ? "border-primary bg-primary" : "border-border bg-surface",
          )}
        >
          {item ? (
            <>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary">
                {index + 1}
              </span>
              {/* 이름 전체 노출(nowrap, 잘림 없음). 넘치면 스트립이 가로 스크롤된다. */}
              <span className="whitespace-nowrap text-[13px] font-semibold text-white">
                {item.name}
              </span>
            </>
          ) : (
            <span className="whitespace-nowrap px-1 text-[13px] font-semibold text-text-disabled">
              {emptyLabel}
              <span className="sr-only">빈 자리</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
