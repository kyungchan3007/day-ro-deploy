import { describe, expect, it } from "vitest";

import type { PlaceCandidate, SituationAnswers } from "../../situation";
import { buildCourseSaveRequest } from "../model/save-course";

function placeCandidate(id: string): PlaceCandidate {
  return {
    placeId: id,
    name: `장소-${id}`,
    category: "CAFE",
    district: "성수",
    address: "서울 성동구 성수이로 10",
    rating: 4.7,
    userRatingCount: 128,
    businessHours: "매일 10:00-22:00",
    latitude: 37.5441,
    longitude: 127.0557,
    photoUrl: `/api/places/photo?name=${id}`,
  };
}

const completeAnswers: SituationAnswers = {
  time: {
    start: { meridiem: "오후", hour: 6, minute: 0 },
    end: { meridiem: "오후", hour: 9, minute: 30 },
  },
  region: {
    districtId: "3120210",
    label: "역삼동",
    dong: "역삼1동",
    categoryId: "강남권",
    categoryLabel: "강남권",
  },
  purpose: "date",
};

describe("buildCourseSaveRequest", () => {
  it("serializes course map state to the backend save contract", () => {
    expect(
      buildCourseSaveRequest({
        draft: {
          name: "역삼 데이트 코스",
          description: "퇴근 후 가볍게 걷는 코스",
        },
        answers: completeAnswers,
        places: [placeCandidate("place-1"), placeCandidate("place-2")],
      }),
    ).toEqual({
      title: "역삼 데이트 코스",
      description: "퇴근 후 가볍게 걷는 코스",
      districtId: "3120210",
      purpose: "CASUAL_DATE",
      startTime: "18:00:00",
      endTime: "21:30:00",
      places: [
        {
          placeId: "place-1",
          name: "장소-place-1",
          category: "CAFE",
          address: "서울 성동구 성수이로 10",
          rating: 4.7,
          userRatingCount: 128,
          businessHours: "매일 10:00-22:00",
          latitude: 37.5441,
          longitude: 127.0557,
          photoUrl: "/api/places/photo?name=place-1",
        },
        {
          placeId: "place-2",
          name: "장소-place-2",
          category: "CAFE",
          address: "서울 성동구 성수이로 10",
          rating: 4.7,
          userRatingCount: 128,
          businessHours: "매일 10:00-22:00",
          latitude: 37.5441,
          longitude: 127.0557,
          photoUrl: "/api/places/photo?name=place-2",
        },
      ],
    });
  });

  it("fails when the course map screen does not have enough answers to save", () => {
    expect(() =>
      buildCourseSaveRequest({
        draft: {
          name: "저장 실패",
          description: "",
        },
        answers: { purpose: "date" },
        places: [placeCandidate("place-1")],
      }),
    ).toThrow("코스 저장에 필요한 정보가 부족합니다.");
  });
});
