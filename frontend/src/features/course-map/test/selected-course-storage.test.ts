import { afterEach, describe, expect, it } from "vitest";

import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import {
  SELECTED_COURSE_STORAGE_KEY,
  readSelectedCoursePlaces,
  saveSelectedCoursePlaces,
} from "../lib/selected-course-storage";

function mockSessionStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function samplePlaces(): PlaceCandidate[] {
  return [
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
  ];
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

describe("selected-course storage bridge", () => {
  it("stores and restores selected places for the course map step", () => {
    installWindowMock();
    const places = samplePlaces();

    saveSelectedCoursePlaces(places);

    expect(readSelectedCoursePlaces()).toEqual(places);
  });

  it("returns an empty array when the selected place payload is broken", () => {
    installWindowMock();
    window.sessionStorage.setItem(SELECTED_COURSE_STORAGE_KEY, '{"places":"oops"}');

    expect(readSelectedCoursePlaces()).toEqual([]);
  });
  it.each(['{', 'null', '{"places":[{}]}', '{"success":true,"message":"ok","data":null}'])(
    "safely rejects corrupt storage: %s",
    (raw) => {
      installWindowMock();
      window.sessionStorage.setItem(SELECTED_COURSE_STORAGE_KEY, raw);
      expect(readSelectedCoursePlaces()).toEqual([]);
    },
  );

});
