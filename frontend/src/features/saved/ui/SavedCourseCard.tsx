import Link from "next/link";
import { ChevronRightIcon, TrashIcon } from "@/shared/ui";
import styles from "./css/SavedCourseCard.module.css";

export interface SavedCourseCardProps {
  /** 썸네일 번호(1부터). */
  href: string;
  number: number;
  name: string;
  desc?: string;
  /** "5곳 · 종로구" 형태. */
  meta: string;
  /** "2026.07.01 저장" 형태. */
  date: string;
  /** 있으면 삭제 버튼을 렌더한다. 클릭 시 상위가 확인 모달을 연다(상태는 상위 훅 소유). */
  onRequestDelete?: () => void;
}

/**
 * 찜한 코스 카드 (features/saved 조각).
 *
 * 번호 썸네일 + 코스명/소개/메타/저장일 + chevron. 눌러서 상세로 이동한다.
 * 삭제 버튼은 Link 바깥의 형제로 두어 중첩 인터랙션을 피한다. 이 컴포넌트는
 * 상태를 갖지 않고, 삭제 클릭을 `onRequestDelete`로 위임만 한다.
 */
export function SavedCourseCard({
  href,
  number,
  name,
  desc,
  meta,
  date,
  onRequestDelete,
}: SavedCourseCardProps) {
  return (
    <div className="relative">
      <Link
        href={href}
        className={`${styles.card} rounded-lg border border-border bg-surface shadow-sm ${
          onRequestDelete ? "pr-12" : ""
        }`}
      >
        <span
          className={`${styles.numberBadge} size-10 shrink-0 rounded-[10px] text-base font-bold text-primary`}
        >
          {number}
        </span>
        <div className={`${styles.content} flex-1`}>
          <p
            className={`${styles.title} text-base font-semibold text-text-strong`}
          >
            {name}
          </p>
          {desc ? (
            <p className={`${styles.desc} text-[13px] text-text-muted`}>{desc}</p>
          ) : null}
          <p className={`${styles.meta} text-xs text-text-muted`}>{meta}</p>
          <p className={`${styles.date} text-[11px] text-text-disabled`}>{date}</p>
        </div>
        <ChevronRightIcon
          size={20}
          className="shrink-0 text-text-disabled"
          aria-hidden="true"
        />
      </Link>
      {onRequestDelete ? (
        <button
          type="button"
          aria-label={`${name} 삭제`}
          onClick={onRequestDelete}
          className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-lg text-text-disabled transition hover:bg-surface-subtle hover:text-danger focus-visible:bg-surface-subtle focus-visible:text-danger active:brightness-95"
        >
          <TrashIcon size={18} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
