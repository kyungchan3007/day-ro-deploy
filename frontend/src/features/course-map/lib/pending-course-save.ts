import {
  courseSaveRequestSchema,
  type CourseSaveRequest,
} from "../../../shared/api/openapi/dayro.openapi";

/**
 * 로그인 대기 중인 코스 저장 (issue #169).
 *
 * 비로그인으로 저장을 누르면 로그인·회원가입으로 이동하는데, 저장 시트에 입력한 코스명·설명과
 * 현재 장소 순서는 화면 state 뿐이라 사라진다. 이동 직전 저장 요청 본문을 rev 와 함께 맡기고,
 * 같은 코스 화면(rev)으로 돌아오면 한 번 꺼내 저장을 이어서 처리한다.
 * 모바일 로그인은 새 탭으로 돌아올 수 있어 탭 간 공유되는 localStorage 를 쓴다.
 */

export const PENDING_COURSE_SAVE_STORAGE_KEY = "dayro:pending-course-save:v1";
/** 로그인·회원가입 왕복에 충분한 보관 시간. 지나면 버린다. */
export const PENDING_COURSE_SAVE_TTL_MS = 30 * 60 * 1000;

const PENDING_VERSION = 1;

/**
 * 저장 요청을 맡긴다. 저장소를 쓸 수 없으면 조용히 넘어간다(로그인 후 다시 저장).
 * @param rev 저장하던 코스 화면 rev.
 * @param request 저장 요청 본문.
 * @param now 맡긴 시각.
 */
export function savePendingCourseSave(
  rev: string,
  request: CourseSaveRequest,
  now: number = Date.now(),
): void {
  try {
    window.localStorage.setItem(
      PENDING_COURSE_SAVE_STORAGE_KEY,
      JSON.stringify({ version: PENDING_VERSION, rev, request, savedAt: now }),
    );
  } catch {
    // 저장소 차단·용량 초과.
  }
}

/**
 * 이 코스 화면(rev)의 대기 저장을 꺼내고 지운다(한 번만 쓴다).
 * 다른 rev 의 대기 저장은 건드리지 않고, 만료·손상 기록은 지운다.
 * @param rev 현재 코스 화면 rev.
 * @param now 기준 시각.
 * @returns 저장 요청 본문. 없으면 null.
 */
export function takePendingCourseSave(
  rev: string | undefined,
  now: number = Date.now(),
): CourseSaveRequest | null {
  if (!rev) {
    return null;
  }
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(PENDING_COURSE_SAVE_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) {
    return null;
  }

  const remove = () => {
    try {
      window.localStorage.removeItem(PENDING_COURSE_SAVE_STORAGE_KEY);
    } catch {
      // 저장소 차단.
    }
  };

  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (
      value?.version !== PENDING_VERSION ||
      typeof value.rev !== "string" ||
      typeof value.savedAt !== "number" ||
      now - value.savedAt >= PENDING_COURSE_SAVE_TTL_MS ||
      value.savedAt > now
    ) {
      remove();
      return null;
    }
    if (value.rev !== rev) {
      return null;
    }
    const request = courseSaveRequestSchema.parse(value.request);
    remove();
    return request;
  } catch {
    remove();
    return null;
  }
}
