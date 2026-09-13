import { describe, expect, it } from "vitest";

import {
  buildCourseRouteUrl,
  getFirstIncompleteSituationStep,
  parseCourseRouteState,
} from "../model/url-state";
import type { SituationAnswers } from "../model/types";

function sampleAnswers(): SituationAnswers {
  return {
    time: {
      start: { meridiem: "오후", hour: 6, minute: 0 },
      end: { meridiem: "오후", hour: 9, minute: 0 },
    },
    region: {
      districtId: "11680",
      label: "역삼동",
      dong: "역삼1동",
      categoryId: "gangnam",
      categoryLabel: "강남권",
    },
    purpose: "date",
  };
}

describe("course route url state", () => {
  it("round-trips complete answers and selected place ids through the URL contract", () => {
    const url = buildCourseRouteUrl({
      step: "course",
      answers: sampleAnswers(),
      selectedPlaceIds: ["place-1", "place-2"],
    });
    const searchParams = new URL(url, "http://localhost:3000").searchParams;

    expect(parseCourseRouteState(searchParams)).toEqual({
      step: "course",
      answers: sampleAnswers(),
      requestId: undefined,
      retryKey: undefined,
      selectedPlaceIds: ["place-1", "place-2"],
      selectedPlaces: [],
      candidatePlaces: [],
    });
  });

  it("keeps retry request metadata on the loading step", () => {
    const url = buildCourseRouteUrl({
      step: "loading",
      answers: sampleAnswers(),
      requestId: "request-1",
      retryKey: "123456",
    });
    const searchParams = new URL(url, "http://localhost:3000").searchParams;

    expect(parseCourseRouteState(searchParams).requestId).toBe("request-1");
    expect(parseCourseRouteState(searchParams).retryKey).toBe("123456");
  });

  it("round-trips selected place snapshots through the course URL contract", () => {
    const url = buildCourseRouteUrl({
      step: "course",
      answers: sampleAnswers(),
      requestId: "request-1",
      selectedPlaceIds: ["place-1"],
      selectedPlaces: [
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
    });
    const searchParams = new URL(url, "http://localhost:3000").searchParams;

    expect(parseCourseRouteState(searchParams).selectedPlaces).toEqual([
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
    ]);
  });

  it("round-trips candidate snapshots through the result URL contract", () => {
    const candidatePlace = {
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
    const url = buildCourseRouteUrl({
      step: "result",
      answers: sampleAnswers(),
      requestId: "request-1",
      candidatePlaces: [candidatePlace],
    });
    const searchParams = new URL(url, "http://localhost:3000").searchParams;

    expect(parseCourseRouteState(searchParams).candidatePlaces).toEqual([
      candidatePlace,
    ]);
  });

  it("finds the first incomplete step from partial answers", () => {
    expect(getFirstIncompleteSituationStep({})).toBe("time");
    expect(
      getFirstIncompleteSituationStep({
        time: sampleAnswers().time,
      }),
    ).toBe("region");
    expect(
      getFirstIncompleteSituationStep({
        time: sampleAnswers().time,
        region: sampleAnswers().region,
      }),
    ).toBe("purpose");
    expect(getFirstIncompleteSituationStep(sampleAnswers())).toBeNull();
  });
});
