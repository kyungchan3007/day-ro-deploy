"use client";

import { Button } from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import { useSavedCourseDetailScreen, type SavedCourseDetailViewModel } from "@/features/saved";
import { CoursePreviewScreen } from "@/widgets/course-preview";
import styles from "./css/SavedCourseDetailScreen.module.css";

export interface SavedCourseDetailScreenProps {
  course: SavedCourseDetailViewModel;
}

/**
 * 저장 코스 상세 화면 (widgets/saved).
 * 목록에서 진입한 저장 코스를 공통 지도 화면으로 보여주고, 공유/수정완료 CTA 를 조합한다.
 */
export function SavedCourseDetailScreen({ course }: SavedCourseDetailScreenProps) {
  const {
    places,
    points,
    isEmpty,
    isReordered,
    reorder,
    resetOrder,
    toastVisible,
    toastMessage,
    toastVariant,
    shareCourse,
    completeEdit,
    canCompleteEdit,
  } = useSavedCourseDetailScreen(course);

  return (
    <CoursePreviewScreen
      nav={<AccountNavBar backHref="/saved" />}
      places={places}
      points={points}
      isEmpty={isEmpty}
      isReordered={isReordered}
      onReorder={reorder}
      onResetOrder={resetOrder}
      footer={
        <div className={styles.actions}>
          <Button variant="tonal" size="lg" fullWidth onClick={shareCourse}>
            길안내 공유
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={completeEdit}
            disabled={!canCompleteEdit}
          >
            수정완료
          </Button>
        </div>
      }
      toastVisible={toastVisible}
      toastMessage={toastMessage}
      toastVariant={toastVariant}
    />
  );
}
