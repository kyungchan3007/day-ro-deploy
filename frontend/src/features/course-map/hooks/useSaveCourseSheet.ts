"use client";

import { useMemo, useState } from "react";

import type { CourseSaveDraft } from "../model/save-course";

export interface SaveCourseSheetStatus {
  type: "error" | "success";
  message: string;
}

export interface UseSaveCourseSheetValue {
  name: string;
  description: string;
  saving: boolean;
  status: SaveCourseSheetStatus | null;
  nameError: string | null;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  submit: () => Promise<"success" | "validation_error" | "error">;
}

/**
 * 코스 저장 sheet 의 입력/제출 상태 훅.
 * draft 수집, 필수값 검증, 제출 중 상태, 결과 메시지 정책을 UI 렌더링 밖으로 분리한다.
 * 저장 성공은 상위 화면 토스트로만 안내하고 시트 안에는 문구를 남기지 않는다(QA #4, issue #179).
 * 시트가 닫히면 안내 문구(검증 · 실패)를 지워, 다시 열었을 때 이전 문구가 남지 않게 한다(issue #192).
 */
export function useSaveCourseSheet(params: {
  open: boolean;
  onSubmit?: (input: CourseSaveDraft) => Promise<void> | void;
}): UseSaveCourseSheetValue {
  const { open, onSubmit } = params;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveCourseSheetStatus | null>(null);
  const [previousOpen, setPreviousOpen] = useState(open);

  // 닫힘 전이에서 렌더 중 바로 문구를 지운다(effect 없이 상태 조정, useAuthSession 과 같은 패턴).
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (!open) {
      setStatus(null);
    }
  }

  const nameError = useMemo(() => {
    if (!status || status.type !== "error") {
      return null;
    }
    return status.message === "코스명을 입력해주세요" ? status.message : null;
  }, [status]);

  const submit = async () => {
    if (saving) {
      return "error" as const;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setStatus({ type: "error", message: "코스명을 입력해주세요" });
      return "validation_error" as const;
    }

    setSaving(true);
    setStatus(null);

    try {
      await onSubmit?.({
        name: trimmedName,
        description: description.trim(),
      });
      // 성공 안내는 토스트가 맡는다. 시트를 다시 열었을 때 완료 문구가 남지 않게 비워 둔다.
      setStatus(null);
      return "success" as const;
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "저장에 실패했습니다.",
      });
      return "error" as const;
    } finally {
      setSaving(false);
    }
  };

  return {
    name,
    description,
    saving,
    status,
    nameError,
    setName,
    setDescription,
    submit,
  };
}
