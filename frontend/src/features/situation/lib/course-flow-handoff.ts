import { parseCourseFlowSnapshot, type CourseFlowSnapshot } from "../model/course-flow";

/**
 * 코스 흐름 스냅샷 로그인 인계 (issue #169).
 *
 * 흐름 상태는 탭 단위 sessionStorage 라, 모바일 카카오 로그인·회원가입이 앱·브라우저 전환을 거쳐
 * 새 탭으로 돌아오면 사라진다. 로그인으로 떠나기 직전 현재 rev 스냅샷 하나만 localStorage 에
 * 잠깐 맡기고, 돌아와 흐름 상태를 처음 읽을 때 한 번 꺼내 쓴 뒤 지운다.
 */

export const COURSE_FLOW_HANDOFF_STORAGE_KEY = "dayro:course-flow-handoff:v1";
/** 로그인·회원가입 왕복에 충분한 보관 시간. 지나면 버린다. */
export const COURSE_FLOW_HANDOFF_TTL_MS = 30 * 60 * 1000;

const HANDOFF_VERSION = 1;

export interface CourseFlowHandoff {
  rev: string;
  snapshot: CourseFlowSnapshot;
}

/**
 * 스냅샷을 인계 저장소에 맡긴다. 저장소를 쓸 수 없으면 조용히 넘어간다(기존 동작 유지).
 * @param handoff 맡길 rev 와 스냅샷.
 * @param now 맡긴 시각.
 */
export function writeCourseFlowHandoff(handoff: CourseFlowHandoff, now: number): void {
  try {
    window.localStorage.setItem(
      COURSE_FLOW_HANDOFF_STORAGE_KEY,
      JSON.stringify({ version: HANDOFF_VERSION, ...handoff, stashedAt: now }),
    );
  } catch {
    // 저장소 차단·용량 초과: 같은 탭 복귀만 가능하다.
  }
}

/**
 * 인계 스냅샷을 꺼내고 저장소에서 지운다(한 번만 쓴다).
 * @param now 기준 시각.
 * @returns 유효한 인계 기록. 없거나 만료·손상이면 null.
 */
export function takeCourseFlowHandoff(now: number): CourseFlowHandoff | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(COURSE_FLOW_HANDOFF_STORAGE_KEY);
    if (raw !== null) {
      window.localStorage.removeItem(COURSE_FLOW_HANDOFF_STORAGE_KEY);
    }
  } catch {
    return null;
  }
  if (raw === null) {
    return null;
  }

  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (
      value?.version !== HANDOFF_VERSION ||
      typeof value.rev !== "string" ||
      typeof value.stashedAt !== "number" ||
      now - value.stashedAt >= COURSE_FLOW_HANDOFF_TTL_MS ||
      value.stashedAt > now
    ) {
      return null;
    }
    const snapshot = parseCourseFlowSnapshot(value.snapshot);
    return snapshot ? { rev: value.rev, snapshot } : null;
  } catch {
    return null;
  }
}
