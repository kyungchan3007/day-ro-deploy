import type { CourseSaveRequest } from "../../../shared/api/openapi/dayro.openapi";
import type { ToastVariant } from "../../../shared/ui/toast";
import { CourseSaveRequestError } from "../api/save-course";
import { takePendingCourseSave } from "./pending-course-save";

export const COURSE_SAVE_MESSAGES = {
  saved: "코스가 저장되었습니다.",
  loginRequired: "로그인 후 다시 저장해주세요.",
  failed: "코스를 저장하지 못했어요. 다시 시도해주세요.",
} as const;

export interface ResumeCourseSaveDeps {
  save: (request: CourseSaveRequest) => Promise<unknown>;
  onSaved: (request: CourseSaveRequest) => void;
  show: (message: string, variant?: ToastVariant) => void;
}

/**
 * 로그인·회원가입 후 돌아온 코스 화면에서 대기 중인 저장을 이어서 처리한다(issue #169).
 * 대기 기록은 요청 전에 지워, 다시 그려지거나 실패해도 같은 저장을 반복하지 않는다.
 * 다시 401 이면 로그인으로 또 보내지 않고 안내만 한다(로그인 왕복 반복 방지).
 * @param rev 현재 코스 화면 rev.
 * @param deps 저장 요청 · 성공 처리 · 토스트.
 * @returns 대기 저장이 있어 처리했으면 true.
 */
export async function resumePendingCourseSave(
  rev: string | undefined,
  deps: ResumeCourseSaveDeps,
): Promise<boolean> {
  const request = takePendingCourseSave(rev);
  if (!request) {
    return false;
  }

  try {
    await deps.save(request);
    deps.onSaved(request);
    deps.show(COURSE_SAVE_MESSAGES.saved, "success");
  } catch (error) {
    deps.show(
      error instanceof CourseSaveRequestError && error.status === 401
        ? COURSE_SAVE_MESSAGES.loginRequired
        : COURSE_SAVE_MESSAGES.failed,
      "info",
    );
  }
  return true;
}
