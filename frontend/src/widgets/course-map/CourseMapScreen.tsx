"use client";

import {
  Button,
} from "@/shared/ui";
import {
  SaveCourseSheet,
  useCourseMapScreen,
} from "@/features/course-map";
import { AccountNavBar } from "@/features/auth";
import { CoursePreviewScreen } from "@/widgets/course-preview";
import type { PlaceCandidate, SituationAnswers } from "@/features/situation";
import styles from "./css/CourseMapScreen.module.css";

export interface CourseMapScreenProps {
  places: PlaceCandidate[];
  answers: SituationAnswers;
  onBack?: () => void;
}

/**
 * 확정 코스(지도 + 경로) 화면 (widgets/course-map).
 *
 * feature 훅(useCourseMapScreen)이 준비한 상태와 액션을 받아,
 * 지도/장소 리스트/저장 시트/CTA 를 화면에 조합만 한다.
 */
export function CourseMapScreen({ places, answers, onBack }: CourseMapScreenProps) {
  const {
    places: orderedPlaces,
    isEmpty,
    points,
    isReordered,
    reorder,
    resetOrder,
    sheetOpen,
    toastVisible,
    toastMessage,
    toastVariant,
    openSaveSheet,
    closeSaveSheet,
    submitSaveSheet,
    startRouteGuide,
  } = useCourseMapScreen(places, answers);

  return (
    <CoursePreviewScreen
      nav={<AccountNavBar onBack={onBack} />}
      places={orderedPlaces}
      points={points}
      isEmpty={isEmpty}
      isReordered={isReordered}
      onReorder={reorder}
      onResetOrder={resetOrder}
      footer={
        <div className={styles.actions}>
          <Button
            variant="tonal"
            size="lg"
            fullWidth
            onClick={openSaveSheet}
            disabled={isEmpty}
          >
            코스 저장하기
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={startRouteGuide}
            disabled={isEmpty}
          >
            경로 안내 시작하기
          </Button>
        </div>
      }
      overlay={
        <SaveCourseSheet
          open={sheetOpen}
          onClose={closeSaveSheet}
          onSubmit={submitSaveSheet}
        />
      }
      toastVisible={toastVisible}
      toastMessage={toastMessage}
      toastVariant={toastVariant}
    />
  );
}
