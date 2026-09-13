"use client";

import { useId } from "react";
import {
  cn,
  ConfirmDialog,
  CheckIcon,
  AlertCircleIcon,
} from "@/shared/ui";
import { authStatic } from "@/shared/static/auth";
import { useWithdrawReasonForm } from "../hooks/useWithdrawReasonForm";
import styles from "./css/WithdrawReasonForm.module.css";

/**
 * 회원탈퇴 사유 폼 (features/auth 조각).
 *
 * 사유 다중선택 + 직접입력(textarea) + 다음 → 확인/완료 모달 흐름을 관리한다.
 */
export function WithdrawReasonForm() {
  const { title, sub, options, etcPlaceholder, nextLabel, confirm, done } =
    authStatic.withdraw;
  const reasonsHintId = useId();
  const etcLabelId = useId();
  const {
    selected,
    etcText,
    confirmOpen,
    doneOpen,
    canNext,
    pending,
    error,
    toggleReason,
    setEtcText,
    openConfirm,
    closeConfirm,
    confirmWithdraw,
    closeDone,
  } = useWithdrawReasonForm();

  return (
    <div className={styles.root}>
      <div className={styles.scrollBody}>
        <fieldset className={styles.fieldset}>
          <legend className="whitespace-pre-line text-xl font-extrabold leading-snug text-text-strong">
            {title} <span className="text-danger">*</span>
          </legend>
          <p id={reasonsHintId} className={`${styles.hint} text-sm text-text-muted`}>
            {sub}
          </p>

          <div className={styles.options} aria-describedby={reasonsHintId}>
            {options.map((opt) => {
              const checked = selected.has(opt.value);
              const inputId = `withdraw-reason-${opt.value}`;

              return (
                <label
                  key={opt.value}
                  htmlFor={inputId}
                  className={styles.optionLabel}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleReason(opt.value)}
                    className="sr-only peer"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-[22px] shrink-0 rounded-md border transition-colors",
                      styles.checkboxIcon,
                      checked
                        ? "border-primary bg-primary text-white"
                        : "border-border-strong text-transparent",
                    )}
                  >
                    <CheckIcon size={14} />
                  </span>
                  <span
                    className={cn(
                      "text-[15px]",
                      checked
                        ? "font-bold text-primary"
                        : "font-medium text-text-strong",
                    )}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}

            {selected.has("etc") && (
              <div className={styles.etcWrap}>
                <label
                  id={etcLabelId}
                  htmlFor="withdraw-etc-reason"
                  className="sr-only"
                >
                  직접 입력 탈퇴 사유
                </label>
                <textarea
                  id="withdraw-etc-reason"
                  value={etcText}
                  onChange={(e) => setEtcText(e.target.value)}
                  placeholder={etcPlaceholder}
                  aria-labelledby={etcLabelId}
                  className={`${styles.textarea} rounded-md border border-border bg-surface-subtle p-3 text-[13px] text-text-strong placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30`}
                />
              </div>
            )}
          </div>
        </fieldset>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          disabled={!canNext}
          onClick={openConfirm}
          className={cn(
            `${styles.submitButton}`,
            canNext
              ? styles.submitButtonEnabled
              : styles.submitButtonDisabled,
          )}
        >
          {nextLabel}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        icon={<AlertCircleIcon size={22} className="text-danger" />}
        title={confirm.title}
        body={
          <span className="whitespace-pre-line">
            {confirm.body}
            {error ? (
              <span className="mt-3 block text-danger">{confirm.error}</span>
            ) : null}
          </span>
        }
        cancelLabel={confirm.cancel}
        confirmLabel={pending ? confirm.pending : confirm.confirm}
        confirmTone="danger"
        pending={pending}
        onConfirm={confirmWithdraw}
      />

      <ConfirmDialog
        open={doneOpen}
        onClose={closeDone}
        icon={<CheckIcon size={22} className="text-success" />}
        title={done.title}
        body={<span className="whitespace-pre-line">{done.body}</span>}
        confirmLabel={done.confirm}
        onConfirm={closeDone}
      />
    </div>
  );
}
