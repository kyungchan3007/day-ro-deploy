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
 * 제출 시 완료 모달을 띄운다. 검증 규칙은 model/contact-validation 이 담당한다.
 *
 * NOTE: UI/UX 전용. 실제 문의 전송(API)은 아직 없어 완료 모달만 노출한다.
 * 계약이 생기면 이 슬라이스(api/hooks)에서 전송 로직을 붙인다.
 */
export function ContactForm() {
  const { subject, body, email, submitLabel, done } = faqStatic.contact;
  const { draft, bodyAtLimit, doneOpen, valid, setField, submit, closeDone } =
    useContactForm();

  const subjectId = useId();
  const bodyId = useId();
  const emailId = useId();

  return (
    <div className={styles.root}>
      <div className={styles.scrollBody}>
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
            {draft.body.length}/{CONTACT_BODY_MAX}자
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
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!valid}
          onClick={submit}
        >
          {submitLabel}
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
