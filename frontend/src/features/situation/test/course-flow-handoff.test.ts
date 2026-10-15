import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COURSE_FLOW_TTL_MS,
  createEmptyCourseFlowState,
  mergeCourseFlowHandoff,
  type CourseFlowSnapshot,
} from "../model/course-flow";
import {
  COURSE_FLOW_HANDOFF_STORAGE_KEY,
  COURSE_FLOW_HANDOFF_TTL_MS,
  takeCourseFlowHandoff,
  writeCourseFlowHandoff,
} from "../lib/course-flow-handoff";
import {
  COURSE_FLOW_STORAGE_KEY,
  getCourseFlowState,
  recordCourseFlowSnapshot,
  resetCourseFlowStateCacheForTest,
  stashCourseFlowHandoff,
} from "../lib/course-flow-storage";

const NOW = 1_800_000_000_000;

const place = {
  placeId: "place-1",
  name: "성수 브런치",
  category: "CAFE",
  district: "성수",
  address: "서울 성동구 성수이로 10",
  rating: 4.7,
  userRatingCount: 128,
  businessHours: "매일 10:00-22:00",
  latitude: 37.5441,
  longitude: 127.0557,
};

const courseSnapshot: CourseFlowSnapshot = {
  step: "course",
  answers: {
    time: {
      start: { meridiem: "오후", hour: 6, minute: 0 },
      end: { meridiem: "오후", hour: 9, minute: 0 },
    },
    region: { districtId: "11680", label: "역삼동" },
    purpose: "date",
  },
  requestId: "request-1",
  candidates: [place],
  selectedPlaces: [place],
  createdAt: NOW - 1000,
};

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

// issue #169: 로그인·회원가입 후 새 탭(sessionStorage 없음)으로 돌아와도 코스 화면을 복원한다.
describe("mergeCourseFlowHandoff", () => {
  it("인계받은 rev 스냅샷을 합친다", () => {
    const merged = mergeCourseFlowHandoff(createEmptyCourseFlowState(), "abcd1234", courseSnapshot, NOW);
    expect(merged.revisions.abcd1234).toEqual(courseSnapshot);
    expect(merged.order).toEqual(["abcd1234"]);
  });

  it("같은 rev 가 이미 있으면(같은 탭 복귀) 덮어쓰지 않는다", () => {
    const existing = { ...courseSnapshot, selectedPlaces: [] };
    const state = {
      ...createEmptyCourseFlowState(),
      revisions: { abcd1234: existing },
      order: ["abcd1234"],
    };
    expect(mergeCourseFlowHandoff(state, "abcd1234", courseSnapshot, NOW)).toBe(state);
  });

  it("만료된 스냅샷 · 잘못된 rev 는 버린다", () => {
    const state = createEmptyCourseFlowState();
    const expired = { ...courseSnapshot, createdAt: NOW - COURSE_FLOW_TTL_MS };
    expect(mergeCourseFlowHandoff(state, "abcd1234", expired, NOW)).toBe(state);
    expect(mergeCourseFlowHandoff(state, "BAD", courseSnapshot, NOW)).toBe(state);
  });
});

describe("course flow handoff storage", () => {
  let local: ReturnType<typeof memoryStorage>;
  let session: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    local = memoryStorage();
    session = memoryStorage();
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session });
    resetCourseFlowStateCacheForTest();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetCourseFlowStateCacheForTest();
  });

  it("맡긴 스냅샷을 한 번 꺼내고 지운다", () => {
    writeCourseFlowHandoff({ rev: "abcd1234", snapshot: courseSnapshot }, NOW);
    expect(takeCourseFlowHandoff(NOW + 1000)).toEqual({ rev: "abcd1234", snapshot: courseSnapshot });
    expect(local.getItem(COURSE_FLOW_HANDOFF_STORAGE_KEY)).toBeNull();
    expect(takeCourseFlowHandoff(NOW + 2000)).toBeNull();
  });

  it("30분이 지나면 버린다", () => {
    writeCourseFlowHandoff({ rev: "abcd1234", snapshot: courseSnapshot }, NOW);
    expect(takeCourseFlowHandoff(NOW + COURSE_FLOW_HANDOFF_TTL_MS)).toBeNull();
  });

  it.each(["{", "null", '{"version":2}', '{"version":1,"rev":"abcd1234","stashedAt":1,"snapshot":{}}'])(
    "손상된 기록은 무시한다: %s",
    (raw) => {
      local.setItem(COURSE_FLOW_HANDOFF_STORAGE_KEY, raw);
      expect(takeCourseFlowHandoff(NOW)).toBeNull();
    },
  );

  it("이전 탭에서 맡긴 스냅샷을 새 탭의 흐름 상태에서 같은 rev 로 읽는다", () => {
    // 이전 탭: 코스 화면 스냅샷 기록 → 로그인 이동 직전 인계
    const rev = recordCourseFlowSnapshot({
      step: "course",
      answers: courseSnapshot.answers,
      requestId: "request-1",
      candidates: [place],
      selectedPlaces: [place],
    });
    expect(stashCourseFlowHandoff(rev)).toBe(true);

    // 새 탭: sessionStorage 비어 있음
    vi.stubGlobal("window", { localStorage: local, sessionStorage: memoryStorage() });
    resetCourseFlowStateCacheForTest();

    const restored = getCourseFlowState().revisions[rev];
    expect(restored?.step).toBe("course");
    expect(restored?.selectedPlaces).toEqual([place]);
    expect(window.sessionStorage.getItem(COURSE_FLOW_STORAGE_KEY)).toContain(rev);
    expect(local.getItem(COURSE_FLOW_HANDOFF_STORAGE_KEY)).toBeNull();
  });

  it("없는 rev 는 맡기지 않는다", () => {
    expect(stashCourseFlowHandoff("zzzz9999")).toBe(false);
    expect(local.getItem(COURSE_FLOW_HANDOFF_STORAGE_KEY)).toBeNull();
  });
});
