"use client";

import { createPortal } from "react-dom";
import { useId } from "react";

import { cn } from "@/shared/ui";
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
 * dialog 접근성(role/aria-modal, ESC/백드롭 닫기, 최초 포커스)을 기본값으로 처리한다.
 */
export function SaveCourseSheet({ open, onClose, onSubmit }: SaveCourseSheetProps) {
  const titleId = useId();
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
  } = useSaveCourseSheet({ onSubmit });
  const {
    mounted,
    dialogRef,
    nameInputRef,
    handleBackdropClick,
    handleFormSubmit,
  } = useSaveCourseSheetDialog({
    open,
    saving,
    onClose,
    onSubmit: submit,
  });

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className={cn(styles.backdrop, styles.open)} onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={status?.message ? statusId : undefined}
      >
        <div className={styles.handle} aria-hidden />
        <h2 id={titleId} className={styles.title}>
          코스 저장하기
        </h2>

        <form onSubmit={handleFormSubmit}>
          <div className={styles.field}>
            <label htmlFor={`${titleId}-name`}>
              코스명 <span className={styles.requiredDot} aria-hidden />
              <span className="sr-only">(필수)</span>
            </label>
            <input
              id={`${titleId}-name`}
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 종로 데이트 코스"
              maxLength={NAME_MAX}
              required
              aria-invalid={nameError ? "true" : undefined}
              aria-describedby={nameError ? statusId : undefined}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`${titleId}-desc`}>한 줄 설명</label>
            <input
              id={`${titleId}-desc`}
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
      </div>
    </div>,
    document.body,
  );
}
