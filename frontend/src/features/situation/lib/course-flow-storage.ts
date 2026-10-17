import {
  appendCourseFlowSnapshot,
  createEmptyCourseFlowState,
  mergeCourseFlowHandoff,
  parseCourseFlowState,
  pruneCourseFlowState,
  type CourseFlowSnapshotInput,
  type CourseFlowState,
} from "../model/course-flow";
import { takeCourseFlowHandoff, writeCourseFlowHandoff } from "./course-flow-handoff";

/** sessionStorage 키. 탭 단위로 유지되어 같은 탭 새로고침·로그인 왕복 후에도 복원된다. */
export const COURSE_FLOW_STORAGE_KEY = "dayro:course-flow:v1";

type Listener = () => void;

let cached: CourseFlowState | null = null;
const listeners = new Set<Listener>();

function readSessionState(now: number): CourseFlowState {
  try {
    const raw = window.sessionStorage.getItem(COURSE_FLOW_STORAGE_KEY);
    // 로드 시점에 만료·초과 스냅샷을 정리해, 화면 복원은 시간 계산 없이 상태만 읽게 한다.
    return raw
      ? pruneCourseFlowState(parseCourseFlowState(JSON.parse(raw)), now)
      : createEmptyCourseFlowState();
  } catch {
    // 저장소 차단·손상 데이터는 빈 상태로 시작한다.
    return createEmptyCourseFlowState();
  }
}

function readFromStorage(): CourseFlowState {
  const now = Date.now();
  const state = readSessionState(now);
  // 로그인·회원가입 후 새 탭으로 돌아온 경우 맡겨 둔 스냅샷을 합친다(issue #169).
  const handoff = takeCourseFlowHandoff(now);
  if (!handoff) {
    return state;
  }
  const merged = mergeCourseFlowHandoff(state, handoff.rev, handoff.snapshot, now);
  if (merged !== state) {
    try {
      // 인계 기록은 지웠으므로 새로고침해도 복원되게 바로 기록한다.
      window.sessionStorage.setItem(COURSE_FLOW_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // 기록 실패: 현재 문서 안에서는 메모리 상태로 이어간다.
    }
  }
  return merged;
}

/**
 * 현재 흐름 상태를 반환한다. 최초 1회 저장소에서 읽고 이후엔 메모리 값을 쓴다.
 * 저장소에 쓸 수 없는 환경에서도 같은 문서 안에서는 메모리 값으로 흐름을 이어간다.
 * @returns 흐름 상태. 서버에서는 항상 빈 상태.
 */
export function getCourseFlowState(): CourseFlowState {
  if (typeof window === "undefined") {
    return createEmptyCourseFlowState();
  }
  if (!cached) {
    cached = readFromStorage();
  }
  return cached;
}

/**
 * 흐름 상태를 갱신하고 저장소에 기록한다. 기록 실패는 메모리 상태로 계속 진행한다.
 * @param update 이전 상태를 받아 새 상태를 돌려주는 순수 함수.
 * @returns 갱신된 상태.
 */
export function updateCourseFlowState(
  update: (state: CourseFlowState) => CourseFlowState,
): CourseFlowState {
  const next = update(getCourseFlowState());
  cached = next;
  try {
    window.sessionStorage.setItem(COURSE_FLOW_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 용량 초과·저장소 차단: 새로고침 복원만 제한되고 현재 흐름은 메모리로 유지된다.
  }
  listeners.forEach((listener) => listener());
  return next;
}

/**
 * 새 화면 상태 스냅샷을 기록하고 rev 를 발급한다.
 * @param input 다음 화면의 step·조건·후보·선택·operation.
 * @param protectedRevs 정리 시 보호할 rev(현재 화면 등).
 * @returns 주소에 실을 rev.
 */
export function recordCourseFlowSnapshot(
  input: CourseFlowSnapshotInput,
  protectedRevs: readonly string[] = [],
): string {
  let rev = "";
  updateCourseFlowState((state) => {
    const appended = appendCourseFlowSnapshot(state, input, Date.now(), protectedRevs);
    rev = appended.rev;
    return appended.state;
  });
  return rev;
}

/**
 * 로그인 화면으로 떠나기 직전 현재 화면 스냅샷을 다른 탭에서도 꺼낼 수 있게 맡긴다(issue #169).
 * @param rev 현재 화면 rev.
 * @returns 맡겼으면 true. rev 스냅샷이 없으면 false.
 */
export function stashCourseFlowHandoff(rev: string): boolean {
  const snapshot = getCourseFlowState().revisions[rev];
  if (!snapshot) {
    return false;
  }
  writeCourseFlowHandoff({ rev, snapshot }, Date.now());
  return true;
}

export function subscribeCourseFlowState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 테스트 전용: 메모리 캐시를 비워 다음 접근 시 저장소에서 다시 읽게 한다. */
export function resetCourseFlowStateCacheForTest(): void {
  cached = null;
  listeners.clear();
}
