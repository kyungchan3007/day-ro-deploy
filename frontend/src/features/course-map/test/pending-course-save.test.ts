import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CourseSaveRequest } from "../../../shared/api/openapi/dayro.openapi";
import { CourseSaveRequestError } from "../api/save-course";
import {
  PENDING_COURSE_SAVE_STORAGE_KEY,
  PENDING_COURSE_SAVE_TTL_MS,
  savePendingCourseSave,
  takePendingCourseSave,
} from "../lib/pending-course-save";
import { COURSE_SAVE_MESSAGES, resumePendingCourseSave } from "../lib/resume-course-save";

const NOW = 1_800_000_000_000;

const request: CourseSaveRequest = {
  title: "성수 데이트",
  description: "브런치 먼저",
  districtId: "11680",
  purpose: "CASUAL_DATE",
  startTime: "18:00:00",
  endTime: "21:00:00",
  places: [
    {
      placeId: "place-1",
      name: "성수 브런치",
      category: "CAFE",
      address: "서울 성동구 성수이로 10",
      rating: 4.7,
      userRatingCount: 128,
      businessHours: "매일 10:00-22:00",
      latitude: 37.5441,
      longitude: 127.0557,
      photoUrl: null,
    },
  ],
};

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

let local: ReturnType<typeof memoryStorage>;

beforeEach(() => {
  local = memoryStorage();
  vi.stubGlobal("window", { localStorage: local });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// issue #169: 로그인·회원가입 후 돌아와 저장을 이어서 처리한다.
describe("pending course save", () => {
  it("같은 rev 로 돌아오면 저장 요청을 꺼내고 지운다", () => {
    savePendingCourseSave("abcd1234", request, NOW);
    expect(takePendingCourseSave("abcd1234", NOW + 1000)).toEqual(request);
    expect(local.getItem(PENDING_COURSE_SAVE_STORAGE_KEY)).toBeNull();
  });

  it("다른 rev 의 대기 저장은 꺼내지 않고 남겨 둔다", () => {
    savePendingCourseSave("abcd1234", request, NOW);
    expect(takePendingCourseSave("zzzz9999", NOW)).toBeNull();
    expect(local.getItem(PENDING_COURSE_SAVE_STORAGE_KEY)).not.toBeNull();
  });

  it("rev 가 없으면 꺼내지 않는다", () => {
    savePendingCourseSave("abcd1234", request, NOW);
    expect(takePendingCourseSave(undefined, NOW)).toBeNull();
  });

  it("30분이 지나면 버리고 지운다", () => {
    savePendingCourseSave("abcd1234", request, NOW);
    expect(takePendingCourseSave("abcd1234", NOW + PENDING_COURSE_SAVE_TTL_MS)).toBeNull();
    expect(local.getItem(PENDING_COURSE_SAVE_STORAGE_KEY)).toBeNull();
  });

  it.each(["{", "null", '{"version":1,"rev":"abcd1234","savedAt":1800000000000,"request":{}}'])(
    "손상된 기록은 무시하고 지운다: %s",
    (raw) => {
      local.setItem(PENDING_COURSE_SAVE_STORAGE_KEY, raw);
      expect(takePendingCourseSave("abcd1234", NOW)).toBeNull();
      expect(local.getItem(PENDING_COURSE_SAVE_STORAGE_KEY)).toBeNull();
    },
  );
});

describe("resumePendingCourseSave", () => {
  function deps(save: (request: CourseSaveRequest) => Promise<unknown>) {
    return { save: vi.fn(save), onSaved: vi.fn(), show: vi.fn() };
  }

  it("대기 저장이 없으면 아무것도 하지 않는다", async () => {
    const d = deps(async () => undefined);
    expect(await resumePendingCourseSave("abcd1234", d)).toBe(false);
    expect(d.save).not.toHaveBeenCalled();
    expect(d.show).not.toHaveBeenCalled();
  });

  it("저장에 성공하면 저장 완료 토스트를 띄운다", async () => {
    savePendingCourseSave("abcd1234", request);
    const d = deps(async () => undefined);
    expect(await resumePendingCourseSave("abcd1234", d)).toBe(true);
    expect(d.save).toHaveBeenCalledWith(request);
    expect(d.onSaved).toHaveBeenCalledWith(request);
    expect(d.show).toHaveBeenCalledWith(COURSE_SAVE_MESSAGES.saved, "success");
  });

  it("다시 401 이면 로그인으로 보내지 않고 안내만 한다", async () => {
    savePendingCourseSave("abcd1234", request);
    const d = deps(async () => {
      throw new CourseSaveRequestError(401, "unauthorized");
    });
    await resumePendingCourseSave("abcd1234", d);
    expect(d.onSaved).not.toHaveBeenCalled();
    expect(d.show).toHaveBeenCalledWith(COURSE_SAVE_MESSAGES.loginRequired, "info");
  });

  it("그 밖의 실패는 다시 시도 안내를 띄운다", async () => {
    savePendingCourseSave("abcd1234", request);
    const d = deps(async () => {
      throw new CourseSaveRequestError(500, "server");
    });
    await resumePendingCourseSave("abcd1234", d);
    expect(d.show).toHaveBeenCalledWith(COURSE_SAVE_MESSAGES.failed, "info");
  });

  it("한 번 처리하면 다시 그려져도 같은 저장을 반복하지 않는다", async () => {
    savePendingCourseSave("abcd1234", request);
    const d = deps(async () => undefined);
    await resumePendingCourseSave("abcd1234", d);
    await resumePendingCourseSave("abcd1234", d);
    expect(d.save).toHaveBeenCalledTimes(1);
  });
});
