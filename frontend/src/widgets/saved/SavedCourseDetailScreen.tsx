"use client";

import { Button } from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import {
  ShareOptionsSheet,
  useSavedCourseDetailScreen,
  type SavedCourseDetailViewModel,
} from "@/features/saved";
import { CoursePreviewScreen } from "@/widgets/course-preview";
import { savedStatic } from "@/shared/static/saved";
import styles from "./css/SavedCourseDetailScreen.module.css";

export interface SavedCourseDetailScreenProps {
  course: SavedCourseDetailViewModel;
  /** 공유 미리보기 설명에 넣을 닉네임(issue #187). */
  sharerName?: string | null;
}

/**
 * 저장 코스 상세 화면 (widgets/saved).
 * 목록에서 진입한 저장 코스를 공통 지도 화면으로 보여주고, 공유/수정완료 CTA 를 조합한다.
 * "길안내 공유"는 공유 방법 시트(링크 복사 · 다른 앱으로 공유)를 연다(issue #183).
 * 공유 링크는 데이로 공유 페이지라 미리보기가 "데이로-코스 일정" 카드로 뜬다(issue #187).
 */
export function SavedCourseDetailScreen({
  course,
  sharerName = null,
}: SavedCourseDetailScreenProps) {
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
    shareSheetOpen,
    canSystemShare,
    closeShareSheet,
    copyShareLink,
    shareViaSystem,
    completeEdit,
    canCompleteEdit,
  } = useSavedCourseDetailScreen(course, sharerName);

  return (
    <>
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
              {savedStatic.detail.shareCta}
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={completeEdit}
              disabled={!canCompleteEdit}
            >
              {savedStatic.detail.completeEditCta}
            </Button>
          </div>
        }
        toastVisible={toastVisible}
        toastMessage={toastMessage}
        toastVariant={toastVariant}
      />
      <ShareOptionsSheet
        open={shareSheetOpen}
        canSystemShare={canSystemShare}
        onClose={closeShareSheet}
        onCopyLink={copyShareLink}
        onSystemShare={shareViaSystem}
      />
    </>
  );
}
