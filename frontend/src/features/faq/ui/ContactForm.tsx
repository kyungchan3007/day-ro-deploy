"use client";

import { useId } from "react";

import { Button, cn, CheckIcon, ConfirmDialog } from "@/shared/ui";
import { faqStatic } from "@/shared/static/faq";
import {
  CONTACT_BODY_MAX,
  CONTACT_SUBJECT_MAX,
} from "../model/contact-validation";
import { useContactForm } from "../hooks/useContactForm";
import styles from "./css/ContactForm.module.css";

/**
 * 문의하기 폼 (features/faq 조각).
 *
 * 제목·내용·이메일을 입력받아 클라이언트 검증(필수/이메일 형식/3,000자 제한)을 수행하고,
 * 제출하면 문의 BFF(`POST /api/inquiries`, issue #224)로 보낸 뒤 성공 시 완료 모달, 실패 시 버튼 위 안내를 띄운다.
 * 검증 규칙은 model/contact-validation, 전송 상태는 hooks/useContactForm 이 담당한다(issue #229 주석 정리).
 */
export function ContactForm() {
  const { notice, subject, body, email, submitLabel, submittingLabel, done } = faqStatic.contact;
  const {
    draft,
    bodyAtLimit,
    doneOpen,
    submitting,
    errorMessage,
    valid,
    setField,
    submit,
    closeDone,
  } =
    useContactForm();

  const subjectId = useId();
  const bodyId = useId();
  const emailId = useId();

  return (
    <div className={styles.root}>
      <div className={styles.scrollBody}>
        <div className={styles.notice} role="note">
          <p className={styles.noticeTitle}>{notice.title}</p>
          <p className={styles.noticeBody}>{notice.body}</p>
        </div>

        <div className={styles.field}>
          <label htmlFor={subjectId} className={styles.label}>
            {subject.label}
            <span className={styles.req} aria-hidden>
              *
            </span>
          </label>
          <input
            id={subjectId}
            type="text"
            className={styles.input}
            value={draft.subject}
            onChange={(e) => setField("subject", e.target.value)}
            placeholder={subject.placeholder}
            maxLength={CONTACT_SUBJECT_MAX}
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={bodyId} className={styles.label}>
            {body.label}
            <span className={styles.req} aria-hidden>
              *
            </span>
          </label>
          <textarea
            id={bodyId}
            className={styles.textarea}
            value={draft.body}
            onChange={(e) => setField("body", e.target.value)}
            placeholder={body.placeholder}
            maxLength={CONTACT_BODY_MAX}
            required
          />
          {bodyAtLimit && (
            <p className={styles.limitWarning} role="alert">
              {body.limitWarning}
            </p>
          )}
          <span
            className={cn(styles.count, bodyAtLimit && styles.countLimit)}
            aria-live="polite"
          >
            {draft.body.length}/{CONTACT_BODY_MAX}{body.countUnit}
          </span>
        </div>

        <div className={styles.field}>
          <label htmlFor={emailId} className={styles.label}>
            {email.label}
            <span className={styles.req} aria-hidden>
              *
            </span>
          </label>
          <input
            id={emailId}
            type="email"
            className={styles.input}
            value={draft.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder={email.placeholder}
            required
          />
          <p className={styles.hint}>{email.hint}</p>
        </div>
      </div>

      <div className={styles.footer}>
        {/* 전송 실패 안내: 버튼 바로 위, 입력은 그대로 둔다(issue #224). */}
        {errorMessage ? (
          <p className={styles.submitError} role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!valid || submitting}
          aria-busy={submitting}
          onClick={submit}
        >
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>

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
