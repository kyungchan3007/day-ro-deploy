"use client";

import { Button, Illustration } from "@/shared/ui";
import { savedStatic } from "@/shared/static/saved";
import { useSavedEmpty } from "../hooks/useSavedEmpty";

/**
 * 찜한 코스 빈 상태 (features/saved 조각).
 *
 * 저장한 코스가 없을 때 일러스트 + 안내 문구 + '코스 만들러 가기' CTA를 보여준다.
 * 일러스트/버튼은 디자인시스템 공용 컴포넌트를 재사용한다. 이동 정책은
 * `useSavedEmpty` 훅이 소유하고, 이 컴포넌트는 핸들러를 버튼에 바인딩만 한다.
 */
export function SavedEmpty() {
  const { goToCreateCourse } = useSavedEmpty();
  const { title, desc, ctaLabel } = savedStatic.empty;

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <Illustration name="date-planning" width={140} />
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-semibold text-text-strong">{title}</p>
        <p className="text-[13px] leading-relaxed text-text-muted">{desc}</p>
      </div>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={goToCreateCourse}
        className="mt-2 max-w-xs"
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
