"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  cn,
  ConfirmDialog,
  CheckIcon,
  AlertCircleIcon,
} from "@/shared/ui";
import { authStatic } from "@/shared/static/auth";

/**
 * 회원탈퇴 사유 폼 (features/auth 조각).
 *
 * 사유 다중선택 + 직접입력(textarea) + 다음 → 확인/완료 모달 흐름을 관리한다.
 *
 * NOTE: UI/UX 전용. 실제 탈퇴 처리(사유 전송/세션 종료)는 없다.
 * 추후 이 슬라이스(api/model)에서 탈퇴 요청·세션 로직을 붙인다.
 */
export function WithdrawReasonForm() {
  const router = useRouter();
  const { title, sub, options, etcPlaceholder, nextLabel, confirm, done } =
    authStatic.withdraw;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [etcText, setEtcText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);

  const toggle = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const canNext = selected.size > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <h1 className="whitespace-pre-line text-xl font-extrabold leading-snug text-text-strong">
          {title} <span className="text-danger">*</span>
        </h1>
        <p className="mt-2 text-sm text-text-muted">{sub}</p>

        <div className="mt-5">
          {options.map((opt) => {
            const checked = selected.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                aria-pressed={checked}
                className="flex w-full items-center gap-3 border-b border-border/60 py-3.5 text-left"
              >
                <span
                  className={cn(
                    "flex size-[22px] shrink-0 items-center justify-center rounded-md border transition-colors",
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
              </button>
            );
          })}

          {selected.has("etc") && (
            <textarea
              value={etcText}
              onChange={(e) => setEtcText(e.target.value)}
              placeholder={etcPlaceholder}
              className="mt-2.5 h-[70px] w-full resize-none rounded-md border border-border bg-surface-subtle p-3 text-[13px] text-text-strong placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>
      </div>

      <div className="border-t border-border px-5 py-3.5">
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setConfirmOpen(true)}
          className={cn(
            "h-[50px] w-full rounded-xl text-base font-bold text-white transition-colors",
            canNext
              ? "bg-primary active:brightness-95"
              : "cursor-not-allowed bg-border-strong",
          )}
        >
          {nextLabel}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={<AlertCircleIcon size={22} className="text-danger" />}
        title={confirm.title}
        body={<span className="whitespace-pre-line">{confirm.body}</span>}
        cancelLabel={confirm.cancel}
        confirmLabel={confirm.confirm}
        confirmTone="danger"
        onConfirm={() => {
          setConfirmOpen(false);
          setDoneOpen(true);
        }}
      />

      <ConfirmDialog
        open={doneOpen}
        onClose={() => router.push("/")}
        icon={<CheckIcon size={22} className="text-success" />}
        title={done.title}
        body={<span className="whitespace-pre-line">{done.body}</span>}
        confirmLabel={done.confirm}
        onConfirm={() => router.push("/")}
      />
    </div>
  );
}
