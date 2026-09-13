import { afterEach, describe, expect, it } from "vitest";

import type { CourseCandidateResponse } from "../../../shared/api/openapi/dayro.openapi";
import {
  LAST_GENERATED_COURSE_STORAGE_KEY,
  readLastGeneratedCourseCandidates,
  saveLastGeneratedCourseCandidates,
} from "../lib/generated-course-storage";

function mockSessionStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

function sampleResponse(): CourseCandidateResponse {
  return {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      places: [
        {
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
        },
      ],
      requestId: "request-1",
      remainingRetries: 5,
    },
  };
}

function installWindowMock() {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      sessionStorage: mockSessionStorage(),
    },
  });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("generated-course storage bridge", () => {
  it("stores and restores the last generated candidates", () => {
    installWindowMock();
    const response = sampleResponse();

    saveLastGeneratedCourseCandidates(response);

    expect(readLastGeneratedCourseCandidates()).toEqual(response);
  });

  it("returns null when the saved candidate payload is broken", () => {
    installWindowMock();
    window.sessionStorage.setItem(LAST_GENERATED_COURSE_STORAGE_KEY, '{"bad":true}');

    expect(readLastGeneratedCourseCandidates()).toBeNull();
  });
  it.each(['{', 'null', '{"places":[{}]}', '{"success":true,"message":"ok","data":null}'])(
    "safely rejects corrupt storage: %s",
    (raw) => {
      installWindowMock();
      window.sessionStorage.setItem(LAST_GENERATED_COURSE_STORAGE_KEY, raw);
      expect(readLastGeneratedCourseCandidates()).toEqual(null);
    },
  );

});
