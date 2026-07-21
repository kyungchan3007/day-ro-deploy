import { ChevronRightIcon } from "@/shared/ui";

export interface SavedCourseCardProps {
  /** 썸네일 번호(1부터). */
  number: number;
  name: string;
  desc: string;
  /** "5곳 · 종로구" 형태. */
  meta: string;
  /** "2026.07.01 저장" 형태. */
  date: string;
}

/**
 * 찜한 코스 카드 (features/saved 조각).
 *
 * 번호 썸네일 + 코스명/소개/메타/저장일 + chevron. 눌러서 상세로 이동한다.
 * 실제 저장 데이터는 추후 이 슬라이스(api/model)에서 준비해 주입한다.
 */
export function SavedCourseCard({
  number,
  name,
  desc,
  meta,
  date,
}: SavedCourseCardProps) {
  return (
    <article className="flex items-center gap-3.5 rounded-lg border border-border bg-surface p-3.5 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary-200 to-primary-100 text-base font-bold text-primary">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-text-strong">{name}</p>
        <p className="mt-0.5 truncate text-[13px] text-text-muted">{desc}</p>
        <p className="mt-1.5 text-xs text-text-muted">{meta}</p>
        <p className="mt-0.5 text-[11px] text-text-disabled">{date}</p>
      </div>
      <ChevronRightIcon
        size={20}
        className="shrink-0 text-text-disabled"
        aria-hidden="true"
      />
    </article>
  );
}
