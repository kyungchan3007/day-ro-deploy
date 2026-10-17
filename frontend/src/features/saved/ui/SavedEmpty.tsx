"use client";

import { Button, EmptyState } from "@/shared/ui";
import { savedStatic } from "@/shared/static/saved";
import { useSavedEmpty } from "../hooks/useSavedEmpty";

/**
 * 찜한 코스 빈 상태 (features/saved 조각).
 *
 * 저장한 코스가 없을 때 일러스트 + 안내 문구 + '코스 만들러 가기' CTA를 보여준다.
 * 빈 상태 틀(`EmptyState`)과 버튼은 디자인시스템 공용 컴포넌트를 재사용한다(issue #227). 이동 정책은
 * `useSavedEmpty` 훅이 소유하고, 이 컴포넌트는 핸들러를 버튼에 바인딩만 한다.
 */
export function SavedEmpty() {
  const { goToCreateCourse } = useSavedEmpty();
  const { title, desc, ctaLabel } = savedStatic.empty;

  return (
    <EmptyState
      title={title}
      description={desc}
      action={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={goToCreateCourse}
          className="mt-2 max-w-xs"
        >
          {ctaLabel}
        </Button>
      }
    />
  );
}
