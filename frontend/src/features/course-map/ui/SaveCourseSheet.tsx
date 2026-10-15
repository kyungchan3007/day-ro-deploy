"use client";

import { useId } from "react";

import { cn } from "@/shared/ui";
import { BottomSheet } from "@/shared/ui/sheet";
import { useSaveCourseSheetDialog } from "../hooks/useSaveCourseSheetDialog";
import { useSaveCourseSheet } from "../hooks/useSaveCourseSheet";
import type { CourseSaveDraft } from "../model/save-course";
import styles from "./css/SaveCourseSheet.module.css";

export interface SaveCourseSheetProps {
  open: boolean;
  onClose: () => void;
  /**
   * 저장 제출 콜백. 성공 시 resolve, 실패 시 throw/reject 로 알린다.
   * 시트는 draft 수집만 담당하고, 실제 저장 orchestration 은 상위 훅이 책임진다.
   */
  onSubmit?: (input: CourseSaveDraft) => Promise<void> | void;
}

const NAME_MAX = 20;
const DESC_MAX = 40;

/**
 * save-course-sheet : 코스 저장 바텀시트 (features/course-map UI 조각).
 *
 * 시안(HTML) 기준의 하단 시트로, 코스명(필수)·한 줄 설명을 입력받아 onSubmit 으로 넘긴다.
 * 폼 상태와 클라이언트 필수 검증만 담당하고, 실제 저장(네트워크)은 상위/훅이 책임진다.
 * 시트 껍데기와 dialog 접근성(role/aria-modal, ESC/백드롭 닫기, 최초 포커스)은 공용 `BottomSheet`(issue #227)가 맡는다.
 */
export function SaveCourseSheet({ open, onClose, onSubmit }: SaveCourseSheetProps) {
  const fieldId = useId();
  const statusId = useId();
  const {
    name,
    description,
    saving,
    status,
    nameError,
    setName,
    setDescription,
    submit,
  } = useSaveCourseSheet({ open, onSubmit });
  const { nameInputRef, handleClose, handleFormSubmit } = useSaveCourseSheetDialog({
    saving,
    onClose,
    onSubmit: submit,
  });

  // sheet 전환 중에도 포커스가 들어가도록 이름 입력 포커스는 다음 프레임에 준다.
  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="코스 저장하기"
      initialFocusRef={nameInputRef}
      deferInitialFocus
      describedBy={status?.message ? statusId : undefined}
    >
      {/* 빈 코스명은 브라우저 기본 안내 대신 앱 문구("코스명을 입력해주세요")로 안내한다(QA #4 후속). */}
      <form className={styles.form} onSubmit={handleFormSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${fieldId}-name`}>
            코스명 <span className={styles.requiredDot} aria-hidden />
            <span className="sr-only">(필수)</span>
          </label>
          <input
            id={`${fieldId}-name`}
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 종로 데이트 코스"
            maxLength={NAME_MAX}
            required
            aria-required="true"
            aria-invalid={nameError ? "true" : undefined}
            aria-describedby={nameError ? statusId : undefined}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${fieldId}-desc`}>한 줄 설명</label>
          <input
            id={`${fieldId}-desc`}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 코스를 한 줄로 소개해보세요"
            maxLength={DESC_MAX}
          />
        </div>

        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "저장 중..." : "저장하기"}
        </button>

        <p
          id={statusId}
          className={cn(
            styles.saveStatus,
            status?.type === "success" && styles.success,
            status?.type === "error" && styles.error,
          )}
          role={status?.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {status?.message ?? ""}
        </p>
      </form>
    </BottomSheet>
  );
}
