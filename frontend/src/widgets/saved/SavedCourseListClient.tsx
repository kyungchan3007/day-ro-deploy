"use client";

import {
  SavedCourseCard,
  SavedEmpty,
  useSavedListScreen,
} from "@/features/saved";
import type { SavedCourseCardViewModel } from "@/features/saved";
import { ConfirmDialog } from "@/shared/ui/dialog";
import { TrashIcon } from "@/shared/ui";
import styles from "./css/SavedListScreen.module.css";

export interface SavedCourseListClientProps {
  initialCourses: SavedCourseCardViewModel[];
}

/**
 * 찜한 코스 목록의 상호작용 부분(클라이언트 경계).
 *
 * 상태·삭제 orchestration은 `useSavedListScreen`이 소유하고, 이 컴포넌트는
 * 값과 핸들러를 카드/모달 JSX에 바인딩만 한다. AppShell·NavBar 등 정적 영역은
 * 상위 서버 컴포넌트(SavedListScreen)에 남겨 클라이언트 번들을 최소화한다.
 */
export function SavedCourseListClient({
  initialCourses,
}: SavedCourseListClientProps) {
  const {
    courses,
    pendingDeleteCourse,
    isDeleting,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useSavedListScreen(initialCourses);

  if (courses.length === 0) {
    return <SavedEmpty />;
  }

  return (
    <>
      <ul aria-label="찜한 코스 목록" className={styles.list}>
        {courses.map((course, index) => (
          <li key={course.id}>
            <SavedCourseCard
              href={`/saved/${course.id}`}
              number={index + 1}
              name={course.name}
              desc={course.desc}
              meta={course.meta}
              date={course.date}
              onRequestDelete={() => requestDelete(course.id)}
            />
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingDeleteCourse !== null}
        onClose={cancelDelete}
        icon={<TrashIcon size={22} className="text-danger" aria-hidden="true" />}
        title="이 코스를 삭제할까요?"
        body={
          <>
            {pendingDeleteCourse
              ? `'${pendingDeleteCourse.name}'을(를) 삭제하면 되돌릴 수 없어요.`
              : null}
            {deleteError ? (
              <span className="mt-2 block text-danger">
                {deleteError.message}
              </span>
            ) : null}
          </>
        }
        confirmLabel="삭제"
        confirmTone="danger"
        cancelLabel="취소"
        onConfirm={confirmDelete}
        pending={isDeleting}
      />
    </>
  );
}
