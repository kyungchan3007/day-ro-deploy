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
 */
export function useSaveCourseSheet(params: {
  onSubmit?: (input: CourseSaveDraft) => Promise<void> | void;
}) : UseSaveCourseSheetValue {
  const { onSubmit } = params;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveCourseSheetStatus | null>(null);

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
      setStatus({ type: "success", message: "코스가 저장되었습니다." });
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
